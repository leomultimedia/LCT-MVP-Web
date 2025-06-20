from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Extend existing models in user.py

class TemplateWizard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    questions = db.Column(db.Text)  # JSON string of wizard questions
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', backref=db.backref('wizards', lazy=True))
    
    def get_questions(self):
        return json.loads(self.questions) if self.questions else []
    
    def set_questions(self, questions_list):
        self.questions = json.dumps(questions_list)

class WizardSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wizard_id = db.Column(db.Integer, db.ForeignKey('template_wizard.id'), nullable=False)
    user_email = db.Column(db.String(120))
    agency_name = db.Column(db.String(200))
    client_name = db.Column(db.String(200))
    answers = db.Column(db.Text)  # JSON string of answers
    report_format = db.Column(db.String(10))  # 'excel', 'word', 'pdf'
    generated_report_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    wizard = db.relationship('TemplateWizard', backref=db.backref('submissions', lazy=True))
    
    def get_answers(self):
        return json.loads(self.answers) if self.answers else {}
    
    def set_answers(self, answers_dict):
        self.answers = json.dumps(answers_dict)

class TemplateUpload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_email = db.Column(db.String(120))
    agency_name = db.Column(db.String(200))
    client_name = db.Column(db.String(200))
    original_filename = db.Column(db.String(255))
    file_path = db.Column(db.String(255))
    file_type = db.Column(db.String(10))  # 'excel', 'word', 'pdf'
    processed_data = db.Column(db.Text)  # JSON string of extracted data
    generated_report_path = db.Column(db.String(255))
    dashboard_data = db.Column(db.Text)  # JSON string for dashboard metrics
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', backref=db.backref('uploads', lazy=True))
    
    def get_processed_data(self):
        return json.loads(self.processed_data) if self.processed_data else {}
    
    def set_processed_data(self, data_dict):
        self.processed_data = json.dumps(data_dict)
    
    def get_dashboard_data(self):
        return json.loads(self.dashboard_data) if self.dashboard_data else {}
    
    def set_dashboard_data(self, data_dict):
        self.dashboard_data = json.dumps(data_dict)


class EndpointTest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    endpoint_url = db.Column(db.String(500), nullable=False)
    test_type = db.Column(db.String(50))  # 'security', 'compliance', 'performance', 'availability'
    test_parameters = db.Column(db.Text)  # JSON string of test configuration
    test_results = db.Column(db.Text)  # JSON string of test results
    status = db.Column(db.String(20), default='pending')  # 'pending', 'running', 'completed', 'failed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    product = db.relationship('Product', backref=db.backref('endpoint_tests', lazy=True))
    
    def get_test_parameters(self):
        return json.loads(self.test_parameters) if self.test_parameters else {}
    
    def set_test_parameters(self, params_dict):
        self.test_parameters = json.dumps(params_dict)
    
    def get_test_results(self):
        return json.loads(self.test_results) if self.test_results else {}
    
    def set_test_results(self, results_dict):
        self.test_results = json.dumps(results_dict)

class AutoFilledTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    endpoint_test_id = db.Column(db.Integer, db.ForeignKey('endpoint_test.id'), nullable=False)
    wizard_id = db.Column(db.Integer, db.ForeignKey('template_wizard.id'), nullable=False)
    auto_filled_data = db.Column(db.Text)  # JSON string of automatically filled answers
    confidence_score = db.Column(db.Float)  # 0.0 to 1.0 confidence in auto-fill accuracy
    manual_review_required = db.Column(db.Boolean, default=False)
    generated_report_path = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    endpoint_test = db.relationship('EndpointTest', backref=db.backref('auto_filled_templates', lazy=True))
    wizard = db.relationship('TemplateWizard', backref=db.backref('auto_filled_templates', lazy=True))
    
    def get_auto_filled_data(self):
        return json.loads(self.auto_filled_data) if self.auto_filled_data else {}
    
    def set_auto_filled_data(self, data_dict):
        self.auto_filled_data = json.dumps(data_dict)

