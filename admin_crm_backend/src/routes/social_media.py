from flask import Blueprint, request, jsonify
from src.models.user import db, SocialMediaPost
from datetime import datetime, timedelta
import random
import json

social_media_bp = Blueprint('social_media', __name__)

# AI Content Templates for different industries and purposes
CONTENT_TEMPLATES = {
    'cybersecurity': [
        "🔒 Cybersecurity Tip: {tip}. Stay protected! #CyberSecurity #InfoSec #DataProtection",
        "🚨 Security Alert: {alert}. Learn how to protect yourself: {solution} #SecurityAwareness",
        "💡 Did you know? {fact} This is why cybersecurity matters. #CyberFacts #Security",
        "🛡️ Protecting your business from {threat}. Here's what you need to know: {advice} #BusinessSecurity"
    ],
    'compliance': [
        "📋 Compliance Update: {update}. Ensure your organization stays compliant. #Compliance #Regulations",
        "✅ GDPR Tip: {tip}. Protect your customers' data and avoid penalties. #GDPR #DataPrivacy",
        "📊 Audit Season: {advice}. Be prepared with these compliance best practices. #Audit #Compliance",
        "🎯 Meeting {standard} requirements: {guidance} #ComplianceStandards #BestPractices"
    ],
    'technology': [
        "🚀 Tech Innovation: {innovation}. The future is here! #Technology #Innovation #DigitalTransformation",
        "💻 Digital Transformation Tip: {tip}. Modernize your business today. #DigitalTransformation",
        "🔧 Tech Solution: {solution} can help streamline {process}. #TechSolutions #Automation",
        "📱 Mobile Security: {tip}. Keep your devices safe. #MobileSecurity #TechTips"
    ],
    'business': [
        "📈 Business Growth: {strategy} can boost your {metric} by {percentage}%. #BusinessGrowth #Strategy",
        "💼 Leadership Insight: {insight}. Great leaders {action}. #Leadership #BusinessTips",
        "🎯 Goal Setting: {tip} to achieve your business objectives. #Goals #Success #Business",
        "🤝 Client Success: {story}. We're proud to help businesses thrive. #ClientSuccess #Partnership"
    ]
}

# Engagement-optimized posting times (hours in UTC)
OPTIMAL_POSTING_TIMES = {
    'linkedin': [8, 12, 17, 18],  # Business hours
    'twitter': [9, 12, 15, 18, 21],  # Throughout the day
    'facebook': [9, 13, 15, 19],  # Peak engagement times
    'instagram': [11, 13, 17, 19]  # Visual content peak times
}

# Hashtag suggestions by category
HASHTAG_SUGGESTIONS = {
    'cybersecurity': ['#CyberSecurity', '#InfoSec', '#DataProtection', '#SecurityAwareness', '#CyberThreats'],
    'compliance': ['#Compliance', '#Regulations', '#GDPR', '#DataPrivacy', '#Audit'],
    'technology': ['#Technology', '#Innovation', '#DigitalTransformation', '#TechSolutions', '#Automation'],
    'business': ['#BusinessGrowth', '#Strategy', '#Leadership', '#Success', '#Entrepreneurship']
}

def generate_ai_content(topic, platform, content_type='post'):
    """Generate AI-powered content for social media"""
    # This would integrate with OpenAI API in production
    # For now, using template-based generation
    
    templates = CONTENT_TEMPLATES.get(topic, CONTENT_TEMPLATES['business'])
    template = random.choice(templates)
    
    # Content variables based on topic
    content_vars = {
        'cybersecurity': {
            'tip': random.choice([
                'Use multi-factor authentication on all accounts',
                'Keep your software updated with latest security patches',
                'Never click suspicious links in emails',
                'Use strong, unique passwords for each account'
            ]),
            'alert': random.choice([
                'New phishing campaign targeting small businesses',
                'Ransomware attacks increasing by 40% this quarter',
                'Data breaches affecting millions of users'
            ]),
            'fact': random.choice([
                '95% of successful cyber attacks are due to human error',
                'A data breach costs an average of $4.45 million',
                'Cybercrime damages will cost $10.5 trillion annually by 2025'
            ]),
            'threat': random.choice(['ransomware', 'phishing attacks', 'data breaches', 'insider threats']),
            'advice': random.choice([
                'Implement zero-trust security architecture',
                'Train employees on security best practices',
                'Regular security audits and penetration testing'
            ]),
            'solution': random.choice([
                'Enable two-factor authentication',
                'Use a reputable antivirus solution',
                'Backup your data regularly'
            ])
        },
        'compliance': {
            'update': random.choice([
                'New GDPR guidelines for AI processing',
                'Updated HIPAA requirements for telehealth',
                'ISO 27001:2022 certification changes'
            ]),
            'tip': random.choice([
                'Document all data processing activities',
                'Implement privacy by design principles',
                'Regular compliance training for staff'
            ]),
            'advice': random.choice([
                'Maintain detailed audit trails',
                'Regular compliance assessments',
                'Update privacy policies annually'
            ]),
            'standard': random.choice(['GDPR', 'HIPAA', 'ISO 27001', 'SOX', 'PCI DSS']),
            'guidance': random.choice([
                'Implement proper access controls',
                'Document all security procedures',
                'Regular compliance monitoring'
            ])
        }
    }
    
    # Fill template with appropriate variables
    vars_for_topic = content_vars.get(topic, {})
    try:
        content = template.format(**vars_for_topic)
    except KeyError:
        # Fallback to simple template
        content = f"🚀 Exciting updates in {topic}! Stay tuned for more insights. #Innovation #Technology"
    
    # Platform-specific optimizations
    if platform == 'twitter':
        # Ensure under 280 characters
        if len(content) > 280:
            content = content[:277] + "..."
    elif platform == 'linkedin':
        # Add professional call-to-action
        content += "\n\nWhat are your thoughts on this? Share your experience in the comments!"
    elif platform == 'instagram':
        # Add more hashtags for discovery
        hashtags = HASHTAG_SUGGESTIONS.get(topic, HASHTAG_SUGGESTIONS['business'])
        content += f"\n\n{' '.join(hashtags[:8])}"
    
    return content

def get_optimal_posting_time(platform, timezone_offset=0):
    """Get optimal posting time for a platform"""
    optimal_hours = OPTIMAL_POSTING_TIMES.get(platform, [9, 12, 15, 18])
    
    # Adjust for timezone
    adjusted_hours = [(hour + timezone_offset) % 24 for hour in optimal_hours]
    
    # Return next optimal time
    current_hour = datetime.utcnow().hour
    next_optimal = min([h for h in adjusted_hours if h > current_hour], default=adjusted_hours[0])
    
    next_post_time = datetime.utcnow().replace(hour=next_optimal, minute=0, second=0, microsecond=0)
    if next_optimal <= current_hour:
        next_post_time += timedelta(days=1)
    
    return next_post_time

@social_media_bp.route('/posts', methods=['GET'])
def get_posts():
    """Get all social media posts with filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        platform = request.args.get('platform')
        status = request.args.get('status')
        
        query = SocialMediaPost.query
        
        if platform:
            query = query.filter_by(platform=platform)
        if status:
            query = query.filter_by(status=status)
        
        posts = query.order_by(SocialMediaPost.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'posts': [post.to_dict() for post in posts.items],
            'total': posts.total,
            'pages': posts.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/posts', methods=['POST'])
def create_post():
    """Create a new social media post"""
    try:
        data = request.get_json()
        
        post = SocialMediaPost(
            platform=data['platform'],
            content=data['content'],
            scheduled_time=datetime.fromisoformat(data['scheduled_time']) if data.get('scheduled_time') else None,
            status=data.get('status', 'draft')
        )
        
        db.session.add(post)
        db.session.commit()
        
        return jsonify(post.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/posts/<int:post_id>', methods=['PUT'])
def update_post(post_id):
    """Update a social media post"""
    try:
        post = SocialMediaPost.query.get_or_404(post_id)
        data = request.get_json()
        
        post.content = data.get('content', post.content)
        post.platform = data.get('platform', post.platform)
        post.scheduled_time = datetime.fromisoformat(data['scheduled_time']) if data.get('scheduled_time') else post.scheduled_time
        post.status = data.get('status', post.status)
        
        if data.get('status') == 'posted' and not post.posted_time:
            post.posted_time = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(post.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/generate-content', methods=['POST'])
def generate_content():
    """Generate AI-powered content for social media"""
    try:
        data = request.get_json()
        
        topic = data.get('topic', 'business')
        platform = data.get('platform', 'linkedin')
        count = data.get('count', 1)
        
        generated_posts = []
        
        for _ in range(min(count, 10)):  # Limit to 10 posts per request
            content = generate_ai_content(topic, platform)
            
            # Get optimal posting time
            optimal_time = get_optimal_posting_time(platform)
            
            post_data = {
                'content': content,
                'platform': platform,
                'suggested_time': optimal_time.isoformat(),
                'hashtags': HASHTAG_SUGGESTIONS.get(topic, [])[:5]
            }
            
            generated_posts.append(post_data)
            
            # Stagger posting times
            optimal_time += timedelta(hours=random.randint(2, 6))
        
        return jsonify({
            'generated_posts': generated_posts,
            'count': len(generated_posts)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/schedule-bulk', methods=['POST'])
def schedule_bulk_posts():
    """Schedule multiple posts in bulk"""
    try:
        data = request.get_json()
        posts_data = data.get('posts', [])
        
        created_posts = []
        
        for post_data in posts_data:
            post = SocialMediaPost(
                platform=post_data['platform'],
                content=post_data['content'],
                scheduled_time=datetime.fromisoformat(post_data['scheduled_time']),
                status='scheduled'
            )
            
            db.session.add(post)
            created_posts.append(post)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Scheduled {len(created_posts)} posts',
            'posts': [post.to_dict() for post in created_posts]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/automation/post-scheduler', methods=['POST'])
def run_post_scheduler():
    """Check and post scheduled content"""
    try:
        now = datetime.utcnow()
        
        # Get posts scheduled for now or earlier
        due_posts = SocialMediaPost.query.filter(
            SocialMediaPost.status == 'scheduled',
            SocialMediaPost.scheduled_time <= now
        ).all()
        
        posted_count = 0
        failed_count = 0
        
        for post in due_posts:
            try:
                # Mock posting to social media platform
                success = mock_post_to_platform(post)
                
                if success:
                    post.status = 'posted'
                    post.posted_time = now
                    posted_count += 1
                else:
                    post.status = 'failed'
                    failed_count += 1
                
            except Exception as e:
                post.status = 'failed'
                failed_count += 1
                print(f"Failed to post {post.id}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'message': f'Processed {len(due_posts)} scheduled posts',
            'posted': posted_count,
            'failed': failed_count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """Get social media analytics"""
    try:
        platform = request.args.get('platform')
        days = request.args.get('days', 30, type=int)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = SocialMediaPost.query.filter(
            SocialMediaPost.posted_time >= start_date
        )
        
        if platform:
            query = query.filter_by(platform=platform)
        
        posts = query.all()
        
        # Calculate analytics
        total_posts = len(posts)
        platforms_breakdown = {}
        engagement_total = 0
        
        for post in posts:
            platform_name = post.platform
            if platform_name not in platforms_breakdown:
                platforms_breakdown[platform_name] = 0
            platforms_breakdown[platform_name] += 1
            
            # Mock engagement metrics
            if post.engagement_metrics:
                engagement_total += sum(post.engagement_metrics.values())
        
        # Mock additional metrics
        avg_engagement = engagement_total / total_posts if total_posts > 0 else 0
        
        # Growth metrics (mock data)
        growth_rate = random.uniform(5, 25)  # 5-25% growth
        reach = total_posts * random.randint(100, 1000)
        impressions = reach * random.randint(2, 5)
        
        return jsonify({
            'period_days': days,
            'total_posts': total_posts,
            'platforms_breakdown': platforms_breakdown,
            'avg_engagement': round(avg_engagement, 2),
            'growth_rate': round(growth_rate, 2),
            'reach': reach,
            'impressions': impressions,
            'engagement_rate': round(avg_engagement / impressions * 100 if impressions > 0 else 0, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@social_media_bp.route('/automation/content-calendar', methods=['GET'])
def generate_content_calendar():
    """Generate automated content calendar"""
    try:
        days = request.args.get('days', 30, type=int)
        platforms = request.args.getlist('platforms') or ['linkedin', 'twitter']
        topics = request.args.getlist('topics') or ['cybersecurity', 'compliance', 'technology']
        
        calendar_posts = []
        start_date = datetime.utcnow()
        
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            
            # Skip weekends for business content
            if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                continue
            
            for platform in platforms:
                # Generate 1-2 posts per platform per day
                posts_per_day = random.randint(1, 2)
                
                for _ in range(posts_per_day):
                    topic = random.choice(topics)
                    content = generate_ai_content(topic, platform)
                    
                    # Get optimal posting time for the day
                    optimal_hours = OPTIMAL_POSTING_TIMES.get(platform, [9, 12, 15])
                    post_hour = random.choice(optimal_hours)
                    
                    post_time = current_date.replace(
                        hour=post_hour,
                        minute=random.randint(0, 59),
                        second=0,
                        microsecond=0
                    )
                    
                    calendar_posts.append({
                        'date': current_date.strftime('%Y-%m-%d'),
                        'time': post_time.strftime('%H:%M'),
                        'platform': platform,
                        'topic': topic,
                        'content': content,
                        'scheduled_datetime': post_time.isoformat()
                    })
        
        return jsonify({
            'calendar': calendar_posts,
            'total_posts': len(calendar_posts),
            'period_days': days
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def mock_post_to_platform(post):
    """Mock function to post content to social media platform"""
    print(f"POSTING TO {post.platform.upper()}:")
    print(f"Content: {post.content}")
    print(f"Scheduled: {post.scheduled_time}")
    print(f"Posted: {datetime.utcnow()}")
    
    # Mock engagement metrics
    engagement_metrics = {
        'likes': random.randint(5, 100),
        'shares': random.randint(1, 20),
        'comments': random.randint(0, 15),
        'clicks': random.randint(10, 200)
    }
    
    post.engagement_metrics = engagement_metrics
    
    # 95% success rate
    return random.random() > 0.05

