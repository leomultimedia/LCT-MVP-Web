from flask import Blueprint, request, jsonify
from src.models.user import db, Lead, User
from datetime import datetime, timedelta
import random
import json

sales_bp = Blueprint('sales', __name__)

# Lead scoring criteria
LEAD_SCORING_RULES = {
    'email_domain': {
        'corporate': 20,  # company email domains
        'gmail': 5,
        'yahoo': 3,
        'other': 10
    },
    'company_size': {
        'enterprise': 50,
        'medium': 30,
        'small': 15,
        'startup': 10
    },
    'source': {
        'referral': 40,
        'linkedin': 30,
        'website': 25,
        'social': 15,
        'cold': 5
    },
    'engagement': {
        'high': 30,
        'medium': 20,
        'low': 10
    }
}

def calculate_lead_score(lead_data):
    """Calculate lead score based on various criteria"""
    score = 0
    
    # Email domain scoring
    email = lead_data.get('email', '')
    if '@' in email:
        domain = email.split('@')[1].lower()
        if domain in ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']:
            score += LEAD_SCORING_RULES['email_domain']['gmail']
        elif any(corp in domain for corp in ['.com', '.org', '.net']) and domain not in ['gmail.com', 'yahoo.com']:
            score += LEAD_SCORING_RULES['email_domain']['corporate']
        else:
            score += LEAD_SCORING_RULES['email_domain']['other']
    
    # Company size scoring (if provided)
    company = lead_data.get('company', '')
    if company:
        # Simple heuristic based on company name
        if any(word in company.lower() for word in ['inc', 'corp', 'ltd', 'llc']):
            score += LEAD_SCORING_RULES['company_size']['medium']
        else:
            score += LEAD_SCORING_RULES['company_size']['small']
    
    # Source scoring
    source = lead_data.get('source', 'website')
    score += LEAD_SCORING_RULES['source'].get(source, 15)
    
    # Random engagement factor (in real system, this would be based on actual behavior)
    engagement_levels = ['low', 'medium', 'high']
    engagement = random.choice(engagement_levels)
    score += LEAD_SCORING_RULES['engagement'][engagement]
    
    return min(score, 100)  # Cap at 100

@sales_bp.route('/leads', methods=['GET'])
def get_leads():
    """Get all leads with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        source = request.args.get('source')
        min_score = request.args.get('min_score', type=int)
        
        query = Lead.query
        
        if status:
            query = query.filter_by(status=status)
        if source:
            query = query.filter_by(source=source)
        if min_score:
            query = query.filter(Lead.score >= min_score)
        
        leads = query.order_by(Lead.score.desc(), Lead.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'leads': [lead.to_dict() for lead in leads.items],
            'total': leads.total,
            'pages': leads.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/leads', methods=['POST'])
def create_lead():
    """Create a new lead with automatic scoring"""
    try:
        data = request.get_json()
        
        # Calculate lead score
        score = calculate_lead_score(data)
        
        # Auto-assign to sales rep based on score
        assigned_to = None
        if score >= 70:
            # High-value leads get assigned to senior sales reps
            senior_reps = User.query.filter_by(role='sales', is_active=True).all()
            if senior_reps:
                assigned_to = random.choice(senior_reps).id
        
        lead = Lead(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            company=data.get('company'),
            source=data.get('source', 'website'),
            score=score,
            notes=data.get('notes'),
            assigned_to=assigned_to
        )
        
        db.session.add(lead)
        db.session.commit()
        
        # Trigger automated follow-up sequence
        trigger_automated_sequence(lead)
        
        return jsonify(lead.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/leads/<int:lead_id>', methods=['PUT'])
def update_lead(lead_id):
    """Update lead information and status"""
    try:
        lead = Lead.query.get_or_404(lead_id)
        data = request.get_json()
        
        # Update fields
        lead.name = data.get('name', lead.name)
        lead.email = data.get('email', lead.email)
        lead.phone = data.get('phone', lead.phone)
        lead.company = data.get('company', lead.company)
        lead.status = data.get('status', lead.status)
        lead.notes = data.get('notes', lead.notes)
        lead.assigned_to = data.get('assigned_to', lead.assigned_to)
        
        # Recalculate score if basic info changed
        if any(key in data for key in ['email', 'company', 'source']):
            lead.score = calculate_lead_score(data)
        
        lead.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(lead.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/leads/<int:lead_id>/convert', methods=['POST'])
def convert_lead(lead_id):
    """Convert lead to customer"""
    try:
        lead = Lead.query.get_or_404(lead_id)
        data = request.get_json()
        
        lead.status = 'converted'
        lead.notes = f"{lead.notes or ''}\n\nConverted on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        if data.get('conversion_notes'):
            lead.notes += f"\nConversion notes: {data['conversion_notes']}"
        
        lead.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Lead converted successfully',
            'lead': lead.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/funnel-stats', methods=['GET'])
def get_funnel_stats():
    """Get sales funnel statistics"""
    try:
        # Count leads by status
        funnel_data = {}
        statuses = ['new', 'contacted', 'qualified', 'converted', 'lost']
        
        for status in statuses:
            count = Lead.query.filter_by(status=status).count()
            funnel_data[status] = count
        
        # Calculate conversion rates
        total_leads = Lead.query.count()
        converted_leads = Lead.query.filter_by(status='converted').count()
        
        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0
        
        # Lead sources breakdown
        source_stats = db.session.query(
            Lead.source,
            db.func.count(Lead.id).label('count')
        ).group_by(Lead.source).all()
        
        # Average lead score by status
        score_stats = db.session.query(
            Lead.status,
            db.func.avg(Lead.score).label('avg_score')
        ).group_by(Lead.status).all()
        
        return jsonify({
            'funnel_data': funnel_data,
            'conversion_rate': round(conversion_rate, 2),
            'total_leads': total_leads,
            'source_breakdown': [
                {'source': row.source, 'count': row.count}
                for row in source_stats
            ],
            'score_by_status': [
                {'status': row.status, 'avg_score': round(float(row.avg_score or 0), 1)}
                for row in score_stats
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sales_bp.route('/automation/sequences', methods=['GET'])
def get_automation_sequences():
    """Get available automation sequences"""
    sequences = [
        {
            'id': 1,
            'name': 'Welcome Series',
            'description': 'Initial welcome and introduction sequence',
            'trigger': 'new_lead',
            'steps': [
                {'day': 0, 'action': 'send_welcome_email'},
                {'day': 1, 'action': 'send_company_info'},
                {'day': 3, 'action': 'schedule_call'}
            ]
        },
        {
            'id': 2,
            'name': 'High-Value Lead Sequence',
            'description': 'Accelerated sequence for high-scoring leads',
            'trigger': 'high_score_lead',
            'steps': [
                {'day': 0, 'action': 'immediate_notification'},
                {'day': 0, 'action': 'priority_assignment'},
                {'day': 1, 'action': 'personal_outreach'}
            ]
        },
        {
            'id': 3,
            'name': 'Re-engagement Campaign',
            'description': 'Re-engage cold or lost leads',
            'trigger': 'inactive_lead',
            'steps': [
                {'day': 0, 'action': 'send_case_study'},
                {'day': 7, 'action': 'send_special_offer'},
                {'day': 14, 'action': 'final_follow_up'}
            ]
        }
    ]
    
    return jsonify({'sequences': sequences})

def trigger_automated_sequence(lead):
    """Trigger appropriate automation sequence for a lead"""
    # This would integrate with email service in production
    sequence_log = {
        'lead_id': lead.id,
        'sequence': 'welcome_series',
        'triggered_at': datetime.utcnow().isoformat(),
        'status': 'active'
    }
    
    # High-value leads get special treatment
    if lead.score >= 70:
        sequence_log['sequence'] = 'high_value_lead'
        # In production, this would trigger immediate notifications
        print(f"HIGH VALUE LEAD ALERT: {lead.name} ({lead.email}) - Score: {lead.score}")
    
    # Log the automation trigger (in production, this would be stored in database)
    print(f"Automation triggered for lead {lead.id}: {sequence_log}")
    
    return sequence_log

@sales_bp.route('/leads/bulk-import', methods=['POST'])
def bulk_import_leads():
    """Bulk import leads from CSV or JSON"""
    try:
        data = request.get_json()
        leads_data = data.get('leads', [])
        
        created_leads = []
        errors = []
        
        for i, lead_data in enumerate(leads_data):
            try:
                # Validate required fields
                if not lead_data.get('name') or not lead_data.get('email'):
                    errors.append(f"Row {i+1}: Missing required fields (name, email)")
                    continue
                
                # Check for duplicates
                existing_lead = Lead.query.filter_by(email=lead_data['email']).first()
                if existing_lead:
                    errors.append(f"Row {i+1}: Lead with email {lead_data['email']} already exists")
                    continue
                
                # Calculate score and create lead
                score = calculate_lead_score(lead_data)
                
                lead = Lead(
                    name=lead_data['name'],
                    email=lead_data['email'],
                    phone=lead_data.get('phone'),
                    company=lead_data.get('company'),
                    source=lead_data.get('source', 'import'),
                    score=score,
                    notes=lead_data.get('notes')
                )
                
                db.session.add(lead)
                created_leads.append(lead)
                
                # Trigger automation for high-value leads
                if score >= 70:
                    trigger_automated_sequence(lead)
                
            except Exception as e:
                errors.append(f"Row {i+1}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully imported {len(created_leads)} leads',
            'created_count': len(created_leads),
            'error_count': len(errors),
            'errors': errors
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

