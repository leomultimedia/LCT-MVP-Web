from flask import Blueprint, request, jsonify
from src.models.user import db, Ticket, User
from datetime import datetime, timedelta
import random
import string

itsm_bp = Blueprint('itsm', __name__)

# SLA definitions (in hours)
SLA_RESPONSE_TIMES = {
    'critical': 1,
    'high': 4,
    'medium': 8,
    'low': 24
}

SLA_RESOLUTION_TIMES = {
    'critical': 4,
    'high': 24,
    'medium': 72,
    'low': 168  # 1 week
}

def generate_ticket_number():
    """Generate unique ticket number"""
    today = datetime.utcnow()
    prefix = f"TKT-{today.year}{today.month:02d}{today.day:02d}"
    
    # Generate random suffix
    suffix = ''.join(random.choices(string.digits, k=4))
    
    ticket_number = f"{prefix}-{suffix}"
    
    # Ensure uniqueness
    while Ticket.query.filter_by(ticket_number=ticket_number).first():
        suffix = ''.join(random.choices(string.digits, k=4))
        ticket_number = f"{prefix}-{suffix}"
    
    return ticket_number

def auto_assign_ticket(ticket):
    """Auto-assign ticket based on category and priority"""
    # Get available ITSM team members
    itsm_users = User.query.filter_by(role='itsm', is_active=True).all()
    
    if not itsm_users:
        return None
    
    # Priority-based assignment
    if ticket.priority in ['critical', 'high']:
        # Assign to senior team members (mock logic)
        senior_users = [user for user in itsm_users if 'senior' in user.name.lower()]
        if senior_users:
            return random.choice(senior_users).id
    
    # Round-robin assignment for other priorities
    return random.choice(itsm_users).id

def calculate_sla_deadlines(ticket):
    """Calculate SLA response and resolution deadlines"""
    created_time = ticket.created_at
    
    response_hours = SLA_RESPONSE_TIMES.get(ticket.priority, 24)
    resolution_hours = SLA_RESOLUTION_TIMES.get(ticket.priority, 168)
    
    response_deadline = created_time + timedelta(hours=response_hours)
    resolution_deadline = created_time + timedelta(hours=resolution_hours)
    
    return response_deadline, resolution_deadline

@itsm_bp.route('/tickets', methods=['GET'])
def get_tickets():
    """Get all tickets with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        priority = request.args.get('priority')
        category = request.args.get('category')
        assigned_to = request.args.get('assigned_to', type=int)
        
        query = Ticket.query
        
        if status:
            query = query.filter_by(status=status)
        if priority:
            query = query.filter_by(priority=priority)
        if category:
            query = query.filter_by(category=category)
        if assigned_to:
            query = query.filter_by(assigned_to=assigned_to)
        
        tickets = query.order_by(
            Ticket.priority.desc(),
            Ticket.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Add SLA information to each ticket
        tickets_with_sla = []
        for ticket in tickets.items:
            ticket_dict = ticket.to_dict()
            response_deadline, resolution_deadline = calculate_sla_deadlines(ticket)
            
            ticket_dict['sla'] = {
                'response_deadline': response_deadline.isoformat(),
                'resolution_deadline': resolution_deadline.isoformat(),
                'response_breached': datetime.utcnow() > response_deadline and ticket.status == 'open',
                'resolution_breached': datetime.utcnow() > resolution_deadline and ticket.status not in ['resolved', 'closed']
            }
            
            tickets_with_sla.append(ticket_dict)
        
        return jsonify({
            'tickets': tickets_with_sla,
            'total': tickets.total,
            'pages': tickets.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@itsm_bp.route('/tickets', methods=['POST'])
def create_ticket():
    """Create a new ticket"""
    try:
        data = request.get_json()
        
        # Generate ticket number
        ticket_number = generate_ticket_number()
        
        # Auto-assign if not specified
        assigned_to = data.get('assigned_to')
        if not assigned_to:
            ticket = Ticket(
                ticket_number=ticket_number,
                title=data['title'],
                description=data['description'],
                priority=data.get('priority', 'medium'),
                category=data.get('category'),
                requester_email=data['requester_email']
            )
            assigned_to = auto_assign_ticket(ticket)
        
        ticket = Ticket(
            ticket_number=ticket_number,
            title=data['title'],
            description=data['description'],
            priority=data.get('priority', 'medium'),
            category=data.get('category'),
            requester_email=data['requester_email'],
            assigned_to=assigned_to
        )
        
        db.session.add(ticket)
        db.session.commit()
        
        # Send notifications
        send_ticket_notifications(ticket, 'created')
        
        # Auto-escalate critical tickets
        if ticket.priority == 'critical':
            escalate_ticket(ticket)
        
        return jsonify(ticket.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@itsm_bp.route('/tickets/<int:ticket_id>', methods=['PUT'])
def update_ticket(ticket_id):
    """Update ticket information"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.get_json()
        
        old_status = ticket.status
        old_assigned_to = ticket.assigned_to
        
        # Update fields
        ticket.title = data.get('title', ticket.title)
        ticket.description = data.get('description', ticket.description)
        ticket.priority = data.get('priority', ticket.priority)
        ticket.status = data.get('status', ticket.status)
        ticket.category = data.get('category', ticket.category)
        ticket.assigned_to = data.get('assigned_to', ticket.assigned_to)
        ticket.resolution = data.get('resolution', ticket.resolution)
        
        # Set resolved timestamp
        if ticket.status == 'resolved' and old_status != 'resolved':
            ticket.resolved_at = datetime.utcnow()
        
        ticket.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Send notifications for status changes
        if old_status != ticket.status:
            send_ticket_notifications(ticket, 'status_changed')
        
        # Send notifications for assignment changes
        if old_assigned_to != ticket.assigned_to:
            send_ticket_notifications(ticket, 'assigned')
        
        return jsonify(ticket.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@itsm_bp.route('/tickets/<int:ticket_id>/escalate', methods=['POST'])
def escalate_ticket_endpoint(ticket_id):
    """Escalate a ticket"""
    try:
        ticket = Ticket.query.get_or_404(ticket_id)
        data = request.get_json()
        
        escalation_result = escalate_ticket(ticket, data.get('reason'))
        
        return jsonify({
            'message': 'Ticket escalated successfully',
            'escalation': escalation_result,
            'ticket': ticket.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@itsm_bp.route('/dashboard', methods=['GET'])
def get_itsm_dashboard():
    """Get ITSM dashboard statistics"""
    try:
        # Ticket counts by status
        status_counts = {}
        statuses = ['open', 'in_progress', 'resolved', 'closed']
        for status in statuses:
            status_counts[status] = Ticket.query.filter_by(status=status).count()
        
        # Ticket counts by priority
        priority_counts = {}
        priorities = ['low', 'medium', 'high', 'critical']
        for priority in priorities:
            priority_counts[priority] = Ticket.query.filter_by(priority=priority).count()
        
        # SLA metrics
        total_tickets = Ticket.query.count()
        
        # Calculate SLA breaches
        sla_breaches = 0
        overdue_tickets = []
        
        for ticket in Ticket.query.filter(Ticket.status.in_(['open', 'in_progress'])).all():
            response_deadline, resolution_deadline = calculate_sla_deadlines(ticket)
            
            if datetime.utcnow() > resolution_deadline:
                sla_breaches += 1
                overdue_tickets.append({
                    'ticket_number': ticket.ticket_number,
                    'title': ticket.title,
                    'priority': ticket.priority,
                    'days_overdue': (datetime.utcnow() - resolution_deadline).days
                })
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_tickets_week = Ticket.query.filter(Ticket.created_at >= week_ago).count()
        resolved_tickets_week = Ticket.query.filter(
            Ticket.resolved_at >= week_ago
        ).count()
        
        # Average resolution time
        resolved_tickets = Ticket.query.filter(
            Ticket.status == 'resolved',
            Ticket.resolved_at.isnot(None)
        ).all()
        
        if resolved_tickets:
            total_resolution_time = sum(
                (ticket.resolved_at - ticket.created_at).total_seconds() / 3600
                for ticket in resolved_tickets
            )
            avg_resolution_time = total_resolution_time / len(resolved_tickets)
        else:
            avg_resolution_time = 0
        
        # Team workload
        team_workload = db.session.query(
            User.name,
            db.func.count(Ticket.id).label('ticket_count')
        ).join(Ticket, User.id == Ticket.assigned_to).filter(
            User.role == 'itsm',
            Ticket.status.in_(['open', 'in_progress'])
        ).group_by(User.id, User.name).all()
        
        return jsonify({
            'status_counts': status_counts,
            'priority_counts': priority_counts,
            'total_tickets': total_tickets,
            'sla_breaches': sla_breaches,
            'sla_compliance_rate': round(((total_tickets - sla_breaches) / total_tickets * 100) if total_tickets > 0 else 100, 2),
            'overdue_tickets': overdue_tickets,
            'new_tickets_week': new_tickets_week,
            'resolved_tickets_week': resolved_tickets_week,
            'avg_resolution_time_hours': round(avg_resolution_time, 2),
            'team_workload': [
                {'name': row.name, 'ticket_count': row.ticket_count}
                for row in team_workload
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@itsm_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get available ticket categories"""
    categories = [
        'Security Incident',
        'Infrastructure',
        'Software Issue',
        'Hardware Problem',
        'Network Connectivity',
        'Access Request',
        'Compliance',
        'Data Backup/Recovery',
        'Performance Issue',
        'Other'
    ]
    
    return jsonify({'categories': categories})

@itsm_bp.route('/automation/sla-monitor', methods=['POST'])
def monitor_sla():
    """Monitor and alert on SLA breaches"""
    try:
        alerts = []
        
        # Check all open and in-progress tickets
        active_tickets = Ticket.query.filter(
            Ticket.status.in_(['open', 'in_progress'])
        ).all()
        
        for ticket in active_tickets:
            response_deadline, resolution_deadline = calculate_sla_deadlines(ticket)
            now = datetime.utcnow()
            
            # Check for response SLA breach
            if now > response_deadline and ticket.status == 'open':
                alerts.append({
                    'type': 'response_breach',
                    'ticket_number': ticket.ticket_number,
                    'title': ticket.title,
                    'priority': ticket.priority,
                    'hours_overdue': (now - response_deadline).total_seconds() / 3600
                })
            
            # Check for resolution SLA breach
            if now > resolution_deadline:
                alerts.append({
                    'type': 'resolution_breach',
                    'ticket_number': ticket.ticket_number,
                    'title': ticket.title,
                    'priority': ticket.priority,
                    'hours_overdue': (now - resolution_deadline).total_seconds() / 3600
                })
        
        # Send alerts (mock implementation)
        for alert in alerts:
            send_sla_alert(alert)
        
        return jsonify({
            'message': f'SLA monitoring completed. Found {len(alerts)} alerts.',
            'alerts': alerts
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@itsm_bp.route('/automation/auto-assign', methods=['POST'])
def auto_assign_unassigned():
    """Auto-assign unassigned tickets"""
    try:
        unassigned_tickets = Ticket.query.filter_by(assigned_to=None).all()
        assigned_count = 0
        
        for ticket in unassigned_tickets:
            assigned_to = auto_assign_ticket(ticket)
            if assigned_to:
                ticket.assigned_to = assigned_to
                ticket.updated_at = datetime.utcnow()
                assigned_count += 1
                
                # Send assignment notification
                send_ticket_notifications(ticket, 'assigned')
        
        db.session.commit()
        
        return jsonify({
            'message': f'Auto-assigned {assigned_count} tickets',
            'assigned_count': assigned_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def escalate_ticket(ticket, reason=None):
    """Escalate a ticket to higher priority/management"""
    # Increase priority if possible
    priority_levels = ['low', 'medium', 'high', 'critical']
    current_index = priority_levels.index(ticket.priority)
    
    if current_index < len(priority_levels) - 1:
        ticket.priority = priority_levels[current_index + 1]
    
    # Add escalation note
    escalation_note = f"ESCALATED on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
    if reason:
        escalation_note += f" - Reason: {reason}"
    
    ticket.notes = f"{ticket.notes or ''}\n{escalation_note}"
    ticket.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    # Send escalation notifications
    send_escalation_notification(ticket, reason)
    
    return {
        'escalated_to': ticket.priority,
        'escalation_time': datetime.utcnow().isoformat(),
        'reason': reason
    }

def send_ticket_notifications(ticket, event_type):
    """Send ticket notifications (mock implementation)"""
    print(f"TICKET NOTIFICATION - {event_type.upper()}:")
    print(f"Ticket: {ticket.ticket_number}")
    print(f"Title: {ticket.title}")
    print(f"Priority: {ticket.priority}")
    print(f"Status: {ticket.status}")
    print(f"Requester: {ticket.requester_email}")
    
    if ticket.assigned_to:
        assignee = User.query.get(ticket.assigned_to)
        if assignee:
            print(f"Assigned to: {assignee.name} ({assignee.email})")
    
    return True

def send_sla_alert(alert):
    """Send SLA breach alert (mock implementation)"""
    print(f"SLA ALERT - {alert['type'].upper()}:")
    print(f"Ticket: {alert['ticket_number']}")
    print(f"Priority: {alert['priority']}")
    print(f"Hours overdue: {alert['hours_overdue']:.1f}")
    return True

def send_escalation_notification(ticket, reason):
    """Send escalation notification (mock implementation)"""
    print(f"ESCALATION NOTIFICATION:")
    print(f"Ticket {ticket.ticket_number} has been escalated to {ticket.priority}")
    if reason:
        print(f"Reason: {reason}")
    return True

