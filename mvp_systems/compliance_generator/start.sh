#!/bin/bash

# Start the Compliance Documentation Generator
cd /home/ubuntu/LearCyberTech/mvp_systems/compliance_generator
export FLASK_APP=src/app.py
export FLASK_ENV=production
python3 -m flask run --host=0.0.0.0 --port=5000
