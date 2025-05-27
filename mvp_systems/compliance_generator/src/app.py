from flask import Flask, render_template, request, send_file, jsonify
import os
import json
import uuid
from datetime import datetime
from weasyprint import HTML, CSS
import markdown
import re

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../static/uploads')
app.config['GENERATED_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../static/generated')
app.config['TEMPLATES_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../templates')

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)

# Load compliance frameworks
FRAMEWORKS = {
    'gdpr': {
        'name': 'GDPR',
        'full_name': 'General Data Protection Regulation',
        'description': 'EU regulation on data protection and privacy',
        'sections': ['Data Protection Policy', 'Privacy Notice', 'Data Breach Response Plan', 'Data Processing Agreement']
    },
    'hipaa': {
        'name': 'HIPAA',
        'full_name': 'Health Insurance Portability and Accountability Act',
        'description': 'US legislation for data privacy in healthcare',
        'sections': ['Privacy Policy', 'Security Policy', 'Breach Notification Procedure', 'Business Associate Agreement']
    },
    'iso27001': {
        'name': 'ISO 27001',
        'full_name': 'ISO/IEC 27001 Information Security Management',
        'description': 'International standard for information security',
        'sections': ['Information Security Policy', 'Risk Assessment Methodology', 'Asset Management', 'Access Control Policy']
    },
    'nist': {
        'name': 'NIST CSF',
        'full_name': 'NIST Cybersecurity Framework',
        'description': 'Framework to improve cybersecurity risk management',
        'sections': ['Identify', 'Protect', 'Detect', 'Respond', 'Recover']
    }
}

@app.route('/')
def index():
    return render_template('index.html', frameworks=FRAMEWORKS)

@app.route('/framework/<framework_id>')
def framework_detail(framework_id):
    if framework_id not in FRAMEWORKS:
        return jsonify({'error': 'Framework not found'}), 404
    
    framework = FRAMEWORKS[framework_id]
    return render_template('framework.html', framework=framework, framework_id=framework_id)

@app.route('/questionnaire/<framework_id>/<section>')
def questionnaire(framework_id, section):
    if framework_id not in FRAMEWORKS:
        return jsonify({'error': 'Framework not found'}), 404
    
    framework = FRAMEWORKS[framework_id]
    
    # Load questions for this framework and section
    questions_file = os.path.join(app.config['TEMPLATES_FOLDER'], f'questions/{framework_id}_{section.lower().replace(" ", "_")}.json')
    
    try:
        with open(questions_file, 'r') as f:
            questions = json.load(f)
    except FileNotFoundError:
        # Use default questions if specific ones aren't available
        questions = [
            {
                "id": "org_name",
                "text": "What is your organization's name?",
                "type": "text",
                "required": True
            },
            {
                "id": "org_description",
                "text": "Briefly describe your organization's activities",
                "type": "textarea",
                "required": True
            },
            {
                "id": "org_size",
                "text": "What is the size of your organization?",
                "type": "select",
                "options": ["1-10 employees", "11-50 employees", "51-250 employees", "251-1000 employees", "1000+ employees"],
                "required": True
            },
            {
                "id": "data_types",
                "text": "What types of data does your organization process?",
                "type": "checkbox",
                "options": ["Personal data", "Sensitive personal data", "Health data", "Financial data", "Employee data", "Customer data", "Other"],
                "required": True
            }
        ]
    
    return render_template('questionnaire.html', 
                          framework=framework, 
                          framework_id=framework_id, 
                          section=section,
                          questions=questions)

@app.route('/generate', methods=['POST'])
def generate_document():
    framework_id = request.form.get('framework_id')
    section = request.form.get('section')
    
    if framework_id not in FRAMEWORKS:
        return jsonify({'error': 'Framework not found'}), 404
    
    # Create a unique ID for this document
    doc_id = str(uuid.uuid4())
    
    # Create a directory for this generation
    doc_dir = os.path.join(app.config['GENERATED_FOLDER'], doc_id)
    os.makedirs(doc_dir, exist_ok=True)
    
    # Save form data
    form_data = {k: v for k, v in request.form.items()}
    with open(os.path.join(doc_dir, 'form_data.json'), 'w') as f:
        json.dump(form_data, f, indent=4)
    
    # Load template
    template_file = os.path.join(app.config['TEMPLATES_FOLDER'], f'documents/{framework_id}_{section.lower().replace(" ", "_")}.md')
    
    try:
        with open(template_file, 'r') as f:
            template = f.read()
    except FileNotFoundError:
        # Use a default template if specific one isn't available
        template = f"""# {section} for {{{{ org_name }}}}

## Introduction

This document outlines the {section.lower()} for {{{{ org_name }}}}, a {{{{ org_description }}}} with {{{{ org_size }}}}.

## Scope

This policy applies to all data processing activities conducted by {{{{ org_name }}}}, including but not limited to {{{{ data_types }}}}.

## Effective Date

This policy is effective from {datetime.now().strftime('%B %d, %Y')}.

## Responsibility

The management of {{{{ org_name }}}} is responsible for ensuring that this policy is implemented and maintained.

## Policy Details

(Detailed policy content would be generated here based on specific requirements)

## Review and Update

This policy will be reviewed annually or when significant changes occur.

## Approval

Approved by: ____________________________

Date: ____________________________

Position: ____________________________
"""
    
    # Replace placeholders with form data
    for key, value in form_data.items():
        if key not in ['framework_id', 'section']:
            template = template.replace('{{{{ ' + key + ' }}}}', value)
    
    # Save the markdown file
    md_file = os.path.join(doc_dir, f'{section.lower().replace(" ", "_")}.md')
    with open(md_file, 'w') as f:
        f.write(template)
    
    # Convert markdown to HTML
    html_content = markdown.markdown(template)
    
    # Add CSS for styling
    css = CSS(string='''
        @page {
            margin: 1cm;
            @top-center {
                content: "Lear Cyber Tech - Compliance Documentation";
                font-size: 9pt;
                color: #666;
            }
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
            }
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", sans-serif;
            font-size: 11pt;
            line-height: 1.5;
        }
        h1 {
            color: #0a0a1a;
            font-size: 18pt;
            margin-top: 2cm;
            margin-bottom: 1cm;
            text-align: center;
            border-bottom: 1px solid #0a0a1a;
            padding-bottom: 0.5cm;
        }
        h2 {
            color: #0a0a1a;
            font-size: 14pt;
            margin-top: 1cm;
            margin-bottom: 0.5cm;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.2cm;
        }
        h3 {
            color: #0a0a1a;
            font-size: 12pt;
            margin-top: 0.8cm;
            margin-bottom: 0.3cm;
        }
        p {
            margin-bottom: 0.5cm;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1cm 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 0.3cm;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .header {
            text-align: center;
            margin-bottom: 1cm;
        }
        .header img {
            height: 2cm;
            margin-bottom: 0.5cm;
        }
        .footer {
            margin-top: 2cm;
            padding-top: 0.5cm;
            border-top: 1px solid #ddd;
        }
    ''')
    
    # Add header with logo
    html_content = f'''
    <div class="header">
        <img src="file://{os.path.abspath(os.path.join(os.path.dirname(__file__), '../../assets/CyberLear-Logo.png'))}" alt="Lear Cyber Tech Logo">
        <h1>{FRAMEWORKS[framework_id]['name']} - {section}</h1>
        <p>Generated on {datetime.now().strftime('%B %d, %Y')}</p>
    </div>
    {html_content}
    <div class="footer">
        <p>This document was automatically generated by Lear Cyber Tech's Compliance Documentation Generator.</p>
        <p>© {datetime.now().year} Lear Cyber Tech. All rights reserved.</p>
    </div>
    '''
    
    # Generate PDF
    pdf_file = os.path.join(doc_dir, f'{section.lower().replace(" ", "_")}.pdf')
    HTML(string=html_content).write_pdf(pdf_file, stylesheets=[css])
    
    return jsonify({
        'success': True,
        'doc_id': doc_id,
        'download_url': f'/download/{doc_id}/{section.lower().replace(" ", "_")}'
    })

@app.route('/download/<doc_id>/<filename>')
def download_file(doc_id, filename):
    # Sanitize filename to prevent directory traversal
    filename = re.sub(r'[^\w_.]', '', filename)
    file_path = os.path.join(app.config['GENERATED_FOLDER'], doc_id, f'{filename}.pdf')
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(file_path, as_attachment=True, download_name=f'{filename}.pdf')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
