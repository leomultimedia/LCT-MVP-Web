import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import json
import os

# Initialize API client
client = ApiClient()

# Create directory for saving results
os.makedirs('/home/ubuntu/LearCyberTech/analysis/results', exist_ok=True)

# Get company details
try:
    company_data = client.call_api('LinkedIn/get_company_details', query={'username': 'leartech'})
    
    # Save raw company data
    with open('/home/ubuntu/LearCyberTech/analysis/results/company_raw_data.json', 'w') as f:
        json.dump(company_data, f, indent=4)
    
    print("Company data retrieved and saved successfully")
    
    # Extract key information
    if company_data.get('success'):
        company_info = company_data.get('data', {})
        company_summary = {
            'name': company_info.get('name'),
            'tagline': company_info.get('tagline'),
            'description': company_info.get('description'),
            'industries': company_info.get('industries', []),
            'specialities': company_info.get('specialities', []),
            'website': company_info.get('website'),
            'follower_count': company_info.get('followerCount'),
            'staff_count': company_info.get('staffCount'),
            'staff_range': company_info.get('staffCountRange')
        }
        
        # Save summarized company data
        with open('/home/ubuntu/LearCyberTech/analysis/results/company_summary.json', 'w') as f:
            json.dump(company_summary, f, indent=4)
        
        print("Company summary extracted and saved")
    else:
        print(f"Error retrieving company data: {company_data.get('message')}")
except Exception as e:
    print(f"Exception occurred while retrieving company data: {str(e)}")

# Get user profile
try:
    user_data = client.call_api('LinkedIn/get_user_profile_by_username', query={'username': 'dr-libin-pallikunnel-kurian-88741530'})
    
    # Save raw user data
    with open('/home/ubuntu/LearCyberTech/analysis/results/user_raw_data.json', 'w') as f:
        json.dump(user_data, f, indent=4)
    
    print("User profile data retrieved and saved successfully")
    
    # Extract key information if available
    if user_data.get('success'):
        user_info = user_data.get('data', {})
        # Extract relevant fields based on the API response structure
        # This will be expanded based on the actual response structure
        
        print("User profile summary extracted and saved")
    else:
        print(f"Error retrieving user profile data: {user_data.get('message')}")
except Exception as e:
    print(f"Exception occurred while retrieving user profile data: {str(e)}")

print("LinkedIn data analysis complete")
