from flask import Blueprint, request, jsonify
from src.models.user import db, Invoice, Lead
from datetime import datetime, timedelta, date
from decimal import Decimal
import calendar
from sqlalchemy import func, extract

finance_bp = Blueprint('finance', __name__)

def generate_invoice_number():
    """Generate unique invoice number"""
    today = datetime.utcnow()
    prefix = f"INV-{today.year}{today.month:02d}"
    
    # Get the last invoice number for this month
    last_invoice = Invoice.query.filter(
        Invoice.invoice_number.like(f"{prefix}%")
    ).order_by(Invoice.invoice_number.desc()).first()
    
    if last_invoice:
        # Extract the sequence number and increment
        last_seq = int(last_invoice.invoice_number.split('-')[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1
    
    return f"{prefix}-{new_seq:04d}"

@finance_bp.route('/invoices', methods=['GET'])
def get_invoices():
    """Get all invoices with filtering and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        client = request.args.get('client')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Invoice.query
        
        if status:
            query = query.filter_by(status=status)
        if client:
            query = query.filter(Invoice.client_name.ilike(f'%{client}%'))
        if date_from:
            query = query.filter(Invoice.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(Invoice.created_at <= datetime.fromisoformat(date_to))
        
        invoices = query.order_by(Invoice.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'invoices': [invoice.to_dict() for invoice in invoices.items],
            'total': invoices.total,
            'pages': invoices.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/invoices', methods=['POST'])
def create_invoice():
    """Create a new invoice"""
    try:
        data = request.get_json()
        
        # Calculate amounts
        amount = Decimal(str(data['amount']))
        tax_rate = Decimal(str(data.get('tax_rate', 0.18)))  # Default 18% tax
        tax_amount = amount * tax_rate
        total_amount = amount + tax_amount
        
        # Generate invoice number
        invoice_number = generate_invoice_number()
        
        invoice = Invoice(
            invoice_number=invoice_number,
            client_name=data['client_name'],
            client_email=data['client_email'],
            amount=amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            description=data.get('description'),
            due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        # Auto-send invoice if requested
        if data.get('auto_send', False):
            send_invoice_email(invoice)
        
        return jsonify(invoice.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>', methods=['PUT'])
def update_invoice(invoice_id):
    """Update invoice information"""
    try:
        invoice = Invoice.query.get_or_404(invoice_id)
        data = request.get_json()
        
        # Update fields
        if 'client_name' in data:
            invoice.client_name = data['client_name']
        if 'client_email' in data:
            invoice.client_email = data['client_email']
        if 'amount' in data:
            amount = Decimal(str(data['amount']))
            tax_rate = Decimal(str(data.get('tax_rate', 0.18)))
            invoice.amount = amount
            invoice.tax_amount = amount * tax_rate
            invoice.total_amount = amount + invoice.tax_amount
        if 'status' in data:
            invoice.status = data['status']
            if data['status'] == 'paid' and not invoice.paid_date:
                invoice.paid_date = datetime.utcnow().date()
        if 'description' in data:
            invoice.description = data['description']
        if 'due_date' in data:
            invoice.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        
        invoice.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(invoice.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>/send', methods=['POST'])
def send_invoice(invoice_id):
    """Send invoice to client"""
    try:
        invoice = Invoice.query.get_or_404(invoice_id)
        
        # Update status to sent
        invoice.status = 'sent'
        invoice.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Send email (mock implementation)
        send_invoice_email(invoice)
        
        return jsonify({
            'message': 'Invoice sent successfully',
            'invoice': invoice.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/invoices/<int:invoice_id>/mark-paid', methods=['POST'])
def mark_invoice_paid(invoice_id):
    """Mark invoice as paid"""
    try:
        invoice = Invoice.query.get_or_404(invoice_id)
        data = request.get_json()
        
        invoice.status = 'paid'
        invoice.paid_date = datetime.strptime(data.get('paid_date', datetime.utcnow().strftime('%Y-%m-%d')), '%Y-%m-%d').date()
        invoice.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice marked as paid',
            'invoice': invoice.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/dashboard', methods=['GET'])
def get_finance_dashboard():
    """Get financial dashboard data"""
    try:
        # Current month stats
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year
        
        # Total revenue
        total_revenue = db.session.query(func.sum(Invoice.total_amount)).filter_by(status='paid').scalar() or 0
        
        # Monthly revenue
        monthly_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.status == 'paid',
            extract('month', Invoice.paid_date) == current_month,
            extract('year', Invoice.paid_date) == current_year
        ).scalar() or 0
        
        # Outstanding invoices
        outstanding_amount = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.status.in_(['sent', 'overdue'])
        ).scalar() or 0
        
        # Overdue invoices
        today = date.today()
        overdue_count = Invoice.query.filter(
            Invoice.due_date < today,
            Invoice.status.in_(['sent', 'overdue'])
        ).count()
        
        overdue_amount = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.due_date < today,
            Invoice.status.in_(['sent', 'overdue'])
        ).scalar() or 0
        
        # Invoice status breakdown
        status_breakdown = db.session.query(
            Invoice.status,
            func.count(Invoice.id).label('count'),
            func.sum(Invoice.total_amount).label('amount')
        ).group_by(Invoice.status).all()
        
        # Recent payments (last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_payments = db.session.query(func.sum(Invoice.total_amount)).filter(
            Invoice.status == 'paid',
            Invoice.paid_date >= thirty_days_ago
        ).scalar() or 0
        
        # Average invoice value
        avg_invoice_value = db.session.query(func.avg(Invoice.total_amount)).scalar() or 0
        
        return jsonify({
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'outstanding_amount': float(outstanding_amount),
            'overdue_count': overdue_count,
            'overdue_amount': float(overdue_amount),
            'recent_payments': float(recent_payments),
            'avg_invoice_value': float(avg_invoice_value),
            'status_breakdown': [
                {
                    'status': row.status,
                    'count': row.count,
                    'amount': float(row.amount or 0)
                } for row in status_breakdown
            ]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/reports/revenue-trend', methods=['GET'])
def get_revenue_trend():
    """Get revenue trend data"""
    try:
        period = request.args.get('period', 'month')  # month, quarter, year
        
        if period == 'month':
            # Last 12 months
            months_data = []
            for i in range(12):
                target_date = datetime.utcnow() - timedelta(days=30*i)
                month_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(
                    Invoice.status == 'paid',
                    extract('month', Invoice.paid_date) == target_date.month,
                    extract('year', Invoice.paid_date) == target_date.year
                ).scalar() or 0
                
                months_data.append({
                    'period': target_date.strftime('%Y-%m'),
                    'revenue': float(month_revenue)
                })
            
            return jsonify({'data': list(reversed(months_data))})
        
        elif period == 'quarter':
            # Last 4 quarters
            quarters_data = []
            for i in range(4):
                target_date = datetime.utcnow() - timedelta(days=90*i)
                quarter = (target_date.month - 1) // 3 + 1
                quarter_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(
                    Invoice.status == 'paid',
                    extract('quarter', Invoice.paid_date) == quarter,
                    extract('year', Invoice.paid_date) == target_date.year
                ).scalar() or 0
                
                quarters_data.append({
                    'period': f"{target_date.year}-Q{quarter}",
                    'revenue': float(quarter_revenue)
                })
            
            return jsonify({'data': list(reversed(quarters_data))})
        
        else:  # year
            # Last 3 years
            years_data = []
            current_year = datetime.utcnow().year
            for i in range(3):
                year = current_year - i
                year_revenue = db.session.query(func.sum(Invoice.total_amount)).filter(
                    Invoice.status == 'paid',
                    extract('year', Invoice.paid_date) == year
                ).scalar() or 0
                
                years_data.append({
                    'period': str(year),
                    'revenue': float(year_revenue)
                })
            
            return jsonify({'data': list(reversed(years_data))})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/reports/aging', methods=['GET'])
def get_aging_report():
    """Get accounts receivable aging report"""
    try:
        today = date.today()
        
        # Define aging buckets
        aging_buckets = [
            {'name': 'Current', 'days': 0},
            {'name': '1-30 days', 'days': 30},
            {'name': '31-60 days', 'days': 60},
            {'name': '61-90 days', 'days': 90},
            {'name': '90+ days', 'days': 999}
        ]
        
        aging_data = []
        
        for i, bucket in enumerate(aging_buckets):
            if i == 0:
                # Current (not overdue)
                invoices = Invoice.query.filter(
                    Invoice.status.in_(['sent', 'overdue']),
                    Invoice.due_date >= today
                ).all()
            elif i == len(aging_buckets) - 1:
                # 90+ days
                cutoff_date = today - timedelta(days=90)
                invoices = Invoice.query.filter(
                    Invoice.status.in_(['sent', 'overdue']),
                    Invoice.due_date < cutoff_date
                ).all()
            else:
                # Other buckets
                start_date = today - timedelta(days=bucket['days'])
                end_date = today - timedelta(days=aging_buckets[i-1]['days'])
                invoices = Invoice.query.filter(
                    Invoice.status.in_(['sent', 'overdue']),
                    Invoice.due_date >= start_date,
                    Invoice.due_date < end_date
                ).all()
            
            total_amount = sum(float(inv.total_amount) for inv in invoices)
            
            aging_data.append({
                'bucket': bucket['name'],
                'count': len(invoices),
                'amount': total_amount,
                'invoices': [inv.to_dict() for inv in invoices]
            })
        
        return jsonify({'aging_data': aging_data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@finance_bp.route('/automation/overdue-reminders', methods=['POST'])
def send_overdue_reminders():
    """Send automated reminders for overdue invoices"""
    try:
        today = date.today()
        
        # Get overdue invoices
        overdue_invoices = Invoice.query.filter(
            Invoice.due_date < today,
            Invoice.status.in_(['sent', 'overdue'])
        ).all()
        
        sent_count = 0
        for invoice in overdue_invoices:
            # Update status to overdue if not already
            if invoice.status != 'overdue':
                invoice.status = 'overdue'
                invoice.updated_at = datetime.utcnow()
            
            # Send reminder email (mock implementation)
            send_overdue_reminder(invoice)
            sent_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Sent {sent_count} overdue reminders',
            'count': sent_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def send_invoice_email(invoice):
    """Mock function to send invoice email"""
    print(f"SENDING INVOICE EMAIL:")
    print(f"To: {invoice.client_email}")
    print(f"Subject: Invoice {invoice.invoice_number} from Lear Cyber Tech")
    print(f"Amount: ${invoice.total_amount}")
    print(f"Due Date: {invoice.due_date}")
    return True

def send_overdue_reminder(invoice):
    """Mock function to send overdue reminder"""
    days_overdue = (date.today() - invoice.due_date).days
    print(f"SENDING OVERDUE REMINDER:")
    print(f"To: {invoice.client_email}")
    print(f"Subject: OVERDUE: Invoice {invoice.invoice_number} - {days_overdue} days past due")
    print(f"Amount: ${invoice.total_amount}")
    return True

@finance_bp.route('/automation/recurring-billing', methods=['GET'])
def get_recurring_billing():
    """Get recurring billing configurations"""
    # Mock recurring billing data
    recurring_configs = [
        {
            'id': 1,
            'client_name': 'ABC Corp',
            'service': 'Monthly Security Audit',
            'amount': 2500.00,
            'frequency': 'monthly',
            'next_billing_date': '2025-07-01',
            'status': 'active'
        },
        {
            'id': 2,
            'client_name': 'XYZ Ltd',
            'service': 'Compliance Monitoring',
            'amount': 1500.00,
            'frequency': 'quarterly',
            'next_billing_date': '2025-09-01',
            'status': 'active'
        }
    ]
    
    return jsonify({'recurring_billing': recurring_configs})

@finance_bp.route('/automation/generate-recurring', methods=['POST'])
def generate_recurring_invoices():
    """Generate invoices for recurring billing"""
    try:
        # This would check for due recurring billing and generate invoices
        # Mock implementation
        generated_count = 0
        
        # In production, this would:
        # 1. Check recurring billing configurations
        # 2. Generate invoices for due items
        # 3. Send invoices automatically
        # 4. Update next billing dates
        
        return jsonify({
            'message': f'Generated {generated_count} recurring invoices',
            'count': generated_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

