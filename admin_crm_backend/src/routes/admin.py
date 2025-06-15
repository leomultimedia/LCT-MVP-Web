from flask import Blueprint, request, jsonify
from src.models.user import db, User, Lead, Invoice, Ticket, SocialMediaPost
from datetime import datetime, timedelta
from sqlalchemy import func

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard', methods=['GET'])
def get_dashboard_stats():
    """Get comprehensive dashboard statistics for admin"""
    try:
        # User statistics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        
        # Lead statistics
        total_leads = Lead.query.count()
        new_leads = Lead.query.filter_by(status='new').count()
        converted_leads = Lead.query.filter_by(status='converted').count()
        
        # Financial statistics
        total_invoices = Invoice.query.count()
        paid_invoices = Invoice.query.filter_by(status='paid').count()
        total_revenue = db.session.query(func.sum(Invoice.total_amount)).filter_by(status='paid').scalar() or 0
        pending_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(Invoice.status.in_(['sent', 'overdue'])).scalar() or 0
        
        # Ticket statistics
        total_tickets = Ticket.query.count()
        open_tickets = Ticket.query.filter(Ticket.status.in_(['open', 'in_progress'])).count()
        resolved_tickets = Ticket.query.filter_by(status='resolved').count()
        
        # Social media statistics
        total_posts = SocialMediaPost.query.count()
        scheduled_posts = SocialMediaPost.query.filter_by(status='scheduled').count()
        posted_today = SocialMediaPost.query.filter(
            SocialMediaPost.posted_time >= datetime.utcnow().date()
        ).count()
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_leads_week = Lead.query.filter(Lead.created_at >= week_ago).count()
        new_tickets_week = Ticket.query.filter(Ticket.created_at >= week_ago).count()
        revenue_week = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.paid_date >= week_ago.date(),
            Invoice.status == 'paid'
        ).scalar() or 0
        
        return jsonify({
            'users': {
                'total': total_users,
                'active': active_users
            },
            'leads': {
                'total': total_leads,
                'new': new_leads,
                'converted': converted_leads,
                'conversion_rate': round((converted_leads / total_leads * 100) if total_leads > 0 else 0, 2)
            },
            'finance': {
                'total_invoices': total_invoices,
                'paid_invoices': paid_invoices,
                'total_revenue': float(total_revenue),
                'pending_revenue': float(pending_revenue),
                'payment_rate': round((paid_invoices / total_invoices * 100) if total_invoices > 0 else 0, 2)
            },
            'tickets': {
                'total': total_tickets,
                'open': open_tickets,
                'resolved': resolved_tickets,
                'resolution_rate': round((resolved_tickets / total_tickets * 100) if total_tickets > 0 else 0, 2)
            },
            'social_media': {
                'total_posts': total_posts,
                'scheduled_posts': scheduled_posts,
                'posted_today': posted_today
            },
            'recent_activity': {
                'new_leads_week': new_leads_week,
                'new_tickets_week': new_tickets_week,
                'revenue_week': float(revenue_week)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        users = User.query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user"""
    try:
        data = request.get_json()
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        user = User(
            email=data['email'],
            name=data['name'],
            role=data.get('role', 'user')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user information"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        user.name = data.get('name', user.name)
        user.role = data.get('role', user.role)
        user.is_active = data.get('is_active', user.is_active)
        
        db.session.commit()
        
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user"""
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system-health', methods=['GET'])
def get_system_health():
    """Get system health metrics"""
    try:
        # Database connection test
        db_status = 'healthy'
        try:
            db.session.execute('SELECT 1')
        except:
            db_status = 'unhealthy'
        
        # Calculate system metrics
        uptime = "System running normally"  # In a real system, this would be actual uptime
        
        return jsonify({
            'database': db_status,
            'uptime': uptime,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'operational'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/reports/revenue', methods=['GET'])
def get_revenue_report():
    """Generate revenue report"""
    try:
        period = request.args.get('period', 'month')  # week, month, quarter, year
        
        if period == 'week':
            start_date = datetime.utcnow() - timedelta(days=7)
        elif period == 'month':
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == 'quarter':
            start_date = datetime.utcnow() - timedelta(days=90)
        else:  # year
            start_date = datetime.utcnow() - timedelta(days=365)
        
        revenue_data = db.session.query(
            func.date(Invoice.paid_date).label('date'),
            func.sum(Invoice.total_amount).label('revenue')
        ).filter(
            Invoice.paid_date >= start_date.date(),
            Invoice.status == 'paid'
        ).group_by(func.date(Invoice.paid_date)).all()
        
        return jsonify({
            'period': period,
            'data': [
                {
                    'date': str(row.date),
                    'revenue': float(row.revenue)
                } for row in revenue_data
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

