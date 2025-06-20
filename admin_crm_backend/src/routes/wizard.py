from flask import Blueprint, request, jsonify
from flask_socketio import SocketIO, emit
import threading
import time
import requests
import ssl
import socket
from datetime import datetime
from src.main import db
from src.models.wizard import TemplateWizard, WizardSubmission, TemplateUpload, EndpointTest, AutoFilledTemplate
from src.models.user import Product
import json
import uuid

wizard_bp = Blueprint("wizard_bp", __name__)

# Initialize SocketIO for real-time updates
socketio = SocketIO(cors_allowed_origins="*")

@wizard_bp.route("/wizards", methods=["GET"])
def get_wizards():
    """Get all available wizards"""
    wizards = TemplateWizard.query.all()
    wizards_data = []
    for wizard in wizards:
        wizards_data.append({
            "id": wizard.id,
            "product_id": wizard.product_id,
            "name": wizard.name,
            "description": wizard.description,
            "questions": wizard.get_questions(),
            "created_at": wizard.created_at.isoformat()
        })
    return jsonify({"wizards": wizards_data}), 200

@wizard_bp.route("/wizards/<int:wizard_id>", methods=["GET"])
def get_wizard(wizard_id):
    """Get specific wizard with questions"""
    wizard = TemplateWizard.query.get_or_404(wizard_id)
    return jsonify({
        "id": wizard.id,
        "product_id": wizard.product_id,
        "name": wizard.name,
        "description": wizard.description,
        "questions": wizard.get_questions(),
        "created_at": wizard.created_at.isoformat()
    }), 200

@wizard_bp.route("/wizards/<int:wizard_id>/submit", methods=["POST"])
def submit_wizard(wizard_id):
    """Submit wizard answers and generate report"""
    data = request.get_json()
    
    # Create submission record
    submission = WizardSubmission(
        wizard_id=wizard_id,
        user_email=data.get("user_email"),
        agency_name=data.get("agency_name"),
        client_name=data.get("client_name"),
        report_format=data.get("report_format", "pdf")
    )
    submission.set_answers(data.get("answers", {}))
    
    db.session.add(submission)
    db.session.commit()
    
    # Generate report in background
    task_id = str(uuid.uuid4())
    thread = threading.Thread(
        target=generate_report_background,
        args=(submission.id, task_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "message": "Wizard submitted successfully",
        "submission_id": submission.id,
        "task_id": task_id
    }), 201

@wizard_bp.route("/endpoint-test", methods=["POST"])
def start_endpoint_test():
    """Start automated endpoint testing"""
    data = request.get_json()
    
    # Create endpoint test record
    endpoint_test = EndpointTest(
        product_id=data.get("product_id"),
        endpoint_url=data.get("endpoint_url"),
        test_type=data.get("test_type", "security"),
        status="pending"
    )
    endpoint_test.set_test_parameters(data.get("test_parameters", {}))
    
    db.session.add(endpoint_test)
    db.session.commit()
    
    # Start testing in background
    task_id = str(uuid.uuid4())
    thread = threading.Thread(
        target=run_endpoint_test_background,
        args=(endpoint_test.id, task_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "message": "Endpoint test started",
        "test_id": endpoint_test.id,
        "task_id": task_id
    }), 201

@wizard_bp.route("/endpoint-test/<int:test_id>/auto-fill", methods=["POST"])
def auto_fill_template(test_id):
    """Auto-fill template based on endpoint test results"""
    data = request.get_json()
    wizard_id = data.get("wizard_id")
    
    endpoint_test = EndpointTest.query.get_or_404(test_id)
    wizard = TemplateWizard.query.get_or_404(wizard_id)
    
    if endpoint_test.status != "completed":
        return jsonify({"error": "Endpoint test not completed"}), 400
    
    # Start auto-fill in background
    task_id = str(uuid.uuid4())
    thread = threading.Thread(
        target=auto_fill_template_background,
        args=(test_id, wizard_id, task_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "message": "Auto-fill started",
        "task_id": task_id
    }), 201

@wizard_bp.route("/upload-template", methods=["POST"])
def upload_template():
    """Upload filled template for processing"""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Save uploaded file
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = f"/tmp/{filename}"
    file.save(file_path)
    
    # Create upload record
    upload = TemplateUpload(
        product_id=request.form.get("product_id"),
        user_email=request.form.get("user_email"),
        agency_name=request.form.get("agency_name"),
        client_name=request.form.get("client_name"),
        original_filename=file.filename,
        file_path=file_path,
        file_type=file.filename.split('.')[-1].lower()
    )
    
    db.session.add(upload)
    db.session.commit()
    
    # Process upload in background
    task_id = str(uuid.uuid4())
    thread = threading.Thread(
        target=process_upload_background,
        args=(upload.id, task_id)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "message": "Template uploaded successfully",
        "upload_id": upload.id,
        "task_id": task_id
    }), 201

def generate_report_background(submission_id, task_id):
    """Background task to generate report from wizard submission"""
    try:
        # Emit progress updates
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 10,
            'status': 'Initializing report generation...'
        })
        
        submission = WizardSubmission.query.get(submission_id)
        wizard = submission.wizard
        answers = submission.get_answers()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 30,
            'status': 'Processing wizard answers...'
        })
        
        # Simulate report generation process
        time.sleep(2)
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 60,
            'status': 'Generating branded report...'
        })
        
        # Generate report based on format
        report_path = generate_branded_report(submission, wizard, answers)
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 90,
            'status': 'Finalizing report...'
        })
        
        # Update submission with report path
        submission.generated_report_path = report_path
        db.session.commit()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 100,
            'status': 'Report generated successfully!',
            'download_url': f'/api/wizard/download/{submission.id}'
        })
        
    except Exception as e:
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 0,
            'status': f'Error: {str(e)}',
            'error': True
        })

def run_endpoint_test_background(test_id, task_id):
    """Background task to run endpoint tests"""
    try:
        endpoint_test = EndpointTest.query.get(test_id)
        endpoint_test.status = "running"
        db.session.commit()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 10,
            'status': 'Starting endpoint tests...'
        })
        
        test_results = {}
        
        # Basic connectivity test
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 20,
            'status': 'Testing connectivity...'
        })
        
        connectivity_result = test_connectivity(endpoint_test.endpoint_url)
        test_results['connectivity'] = connectivity_result
        
        # Security headers test
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 40,
            'status': 'Checking security headers...'
        })
        
        security_result = test_security_headers(endpoint_test.endpoint_url)
        test_results['security_headers'] = security_result
        
        # SSL/TLS test
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 60,
            'status': 'Testing SSL/TLS configuration...'
        })
        
        ssl_result = test_ssl_configuration(endpoint_test.endpoint_url)
        test_results['ssl_tls'] = ssl_result
        
        # Performance test
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 80,
            'status': 'Running performance tests...'
        })
        
        performance_result = test_performance(endpoint_test.endpoint_url)
        test_results['performance'] = performance_result
        
        # Update test results
        endpoint_test.set_test_results(test_results)
        endpoint_test.status = "completed"
        endpoint_test.completed_at = datetime.utcnow()
        db.session.commit()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 100,
            'status': 'Endpoint testing completed!',
            'results': test_results
        })
        
    except Exception as e:
        endpoint_test.status = "failed"
        db.session.commit()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 0,
            'status': f'Error: {str(e)}',
            'error': True
        })

def auto_fill_template_background(test_id, wizard_id, task_id):
    """Background task to auto-fill template based on test results"""
    try:
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 10,
            'status': 'Analyzing test results...'
        })
        
        endpoint_test = EndpointTest.query.get(test_id)
        wizard = TemplateWizard.query.get(wizard_id)
        test_results = endpoint_test.get_test_results()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 30,
            'status': 'Mapping results to template fields...'
        })
        
        # Auto-fill logic based on test results
        auto_filled_data = map_test_results_to_template(test_results, wizard.get_questions())
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 60,
            'status': 'Calculating confidence scores...'
        })
        
        confidence_score = calculate_confidence_score(auto_filled_data, test_results)
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 80,
            'status': 'Generating auto-filled template...'
        })
        
        # Create auto-filled template record
        auto_filled = AutoFilledTemplate(
            endpoint_test_id=test_id,
            wizard_id=wizard_id,
            confidence_score=confidence_score,
            manual_review_required=confidence_score < 0.8
        )
        auto_filled.set_auto_filled_data(auto_filled_data)
        
        db.session.add(auto_filled)
        db.session.commit()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 100,
            'status': 'Auto-fill completed!',
            'auto_filled_id': auto_filled.id,
            'confidence_score': confidence_score,
            'manual_review_required': auto_filled.manual_review_required
        })
        
    except Exception as e:
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 0,
            'status': f'Error: {str(e)}',
            'error': True
        })

def process_upload_background(upload_id, task_id):
    """Background task to process uploaded template"""
    try:
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 10,
            'status': 'Processing uploaded file...'
        })
        
        upload = TemplateUpload.query.get(upload_id)
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 30,
            'status': 'Extracting data from template...'
        })
        
        # Extract data based on file type
        extracted_data = extract_data_from_file(upload.file_path, upload.file_type)
        upload.set_processed_data(extracted_data)
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 60,
            'status': 'Generating dashboard metrics...'
        })
        
        # Generate dashboard data
        dashboard_data = generate_dashboard_metrics(extracted_data)
        upload.set_dashboard_data(dashboard_data)
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 80,
            'status': 'Creating comprehensive report...'
        })
        
        # Generate comprehensive report
        report_path = generate_comprehensive_report(upload, extracted_data)
        upload.generated_report_path = report_path
        
        db.session.commit()
        
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 100,
            'status': 'Upload processing completed!',
            'dashboard_data': dashboard_data,
            'report_url': f'/api/wizard/download-upload/{upload.id}'
        })
        
    except Exception as e:
        socketio.emit('task_progress', {
            'task_id': task_id,
            'progress': 0,
            'status': f'Error: {str(e)}',
            'error': True
        })

# Helper functions for testing
def test_connectivity(url):
    """Test basic connectivity to endpoint"""
    try:
        response = requests.get(url, timeout=10)
        return {
            "status": "success",
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds(),
            "accessible": True
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "accessible": False
        }

def test_security_headers(url):
    """Test security headers"""
    try:
        response = requests.get(url, timeout=10)
        headers = response.headers
        
        security_headers = {
            "X-Frame-Options": headers.get("X-Frame-Options"),
            "X-Content-Type-Options": headers.get("X-Content-Type-Options"),
            "X-XSS-Protection": headers.get("X-XSS-Protection"),
            "Strict-Transport-Security": headers.get("Strict-Transport-Security"),
            "Content-Security-Policy": headers.get("Content-Security-Policy")
        }
        
        score = sum(1 for v in security_headers.values() if v is not None)
        
        return {
            "status": "success",
            "headers": security_headers,
            "score": f"{score}/5",
            "grade": "A" if score >= 4 else "B" if score >= 3 else "C" if score >= 2 else "D"
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }

def test_ssl_configuration(url):
    """Test SSL/TLS configuration"""
    try:
        from urllib.parse import urlparse
        parsed_url = urlparse(url)
        hostname = parsed_url.hostname
        port = parsed_url.port or (443 if parsed_url.scheme == 'https' else 80)
        
        if parsed_url.scheme != 'https':
            return {
                "status": "warning",
                "message": "Not using HTTPS",
                "secure": False
            }
        
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                return {
                    "status": "success",
                    "secure": True,
                    "protocol": ssock.version(),
                    "cipher": ssock.cipher(),
                    "certificate": {
                        "subject": dict(x[0] for x in cert['subject']),
                        "issuer": dict(x[0] for x in cert['issuer']),
                        "version": cert['version'],
                        "not_before": cert['notBefore'],
                        "not_after": cert['notAfter']
                    }
                }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e),
            "secure": False
        }

def test_performance(url):
    """Test endpoint performance"""
    try:
        times = []
        for _ in range(3):
            start_time = time.time()
            response = requests.get(url, timeout=10)
            end_time = time.time()
            times.append(end_time - start_time)
        
        avg_time = sum(times) / len(times)
        
        return {
            "status": "success",
            "average_response_time": avg_time,
            "min_response_time": min(times),
            "max_response_time": max(times),
            "performance_grade": "A" if avg_time < 1 else "B" if avg_time < 3 else "C" if avg_time < 5 else "D"
        }
    except Exception as e:
        return {
            "status": "failed",
            "error": str(e)
        }

def map_test_results_to_template(test_results, questions):
    """Map test results to template questions"""
    auto_filled = {}
    
    for question in questions:
        question_id = question.get('id')
        question_type = question.get('type')
        question_text = question.get('text', '').lower()
        
        # Map based on question content
        if 'ssl' in question_text or 'tls' in question_text:
            if 'ssl_tls' in test_results:
                auto_filled[question_id] = test_results['ssl_tls'].get('secure', False)
        
        elif 'security' in question_text and 'header' in question_text:
            if 'security_headers' in test_results:
                auto_filled[question_id] = test_results['security_headers'].get('grade', 'Unknown')
        
        elif 'performance' in question_text or 'response time' in question_text:
            if 'performance' in test_results:
                auto_filled[question_id] = test_results['performance'].get('performance_grade', 'Unknown')
        
        elif 'accessible' in question_text or 'available' in question_text:
            if 'connectivity' in test_results:
                auto_filled[question_id] = test_results['connectivity'].get('accessible', False)
    
    return auto_filled

def calculate_confidence_score(auto_filled_data, test_results):
    """Calculate confidence score for auto-filled data"""
    if not auto_filled_data:
        return 0.0
    
    # Base confidence on successful tests
    successful_tests = sum(1 for result in test_results.values() if result.get('status') == 'success')
    total_tests = len(test_results)
    
    if total_tests == 0:
        return 0.0
    
    return min(1.0, successful_tests / total_tests)

def generate_branded_report(submission, wizard, answers):
    """Generate branded report from submission"""
    # This would integrate with report generation libraries
    # For now, return a placeholder path
    return f"/tmp/report_{submission.id}.pdf"

def extract_data_from_file(file_path, file_type):
    """Extract data from uploaded file"""
    # This would use appropriate libraries to extract data
    # For now, return placeholder data
    return {
        "extracted_fields": {},
        "metadata": {
            "file_type": file_type,
            "processed_at": datetime.utcnow().isoformat()
        }
    }

def generate_dashboard_metrics(extracted_data):
    """Generate dashboard metrics from extracted data"""
    # This would analyze the data and generate metrics
    return {
        "total_fields": len(extracted_data.get("extracted_fields", {})),
        "completion_rate": 0.85,
        "risk_score": 0.3,
        "compliance_score": 0.9
    }

def generate_comprehensive_report(upload, extracted_data):
    """Generate comprehensive report from upload"""
    # This would create a detailed report
    return f"/tmp/comprehensive_report_{upload.id}.pdf"

