const mongoose = require('mongoose');

const SocialMediaPostSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialMediaAccount',
    required: true
  },
  content: {
    text: {
      type: String,
      required: true
    },
    images: [{
      url: {
        type: String,
        trim: true
      },
      altText: {
        type: String,
        trim: true
      }
    }],
    video: {
      url: {
        type: String,
        trim: true
      },
      thumbnailUrl: {
        type: String,
        trim: true
      }
    },
    link: {
      type: String,
      trim: true
    }
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed', 'archived'],
    default: 'draft'
  },
  scheduledTime: {
    type: Date
  },
  publishedTime: {
    type: Date
  },
  postId: {
    type: String,
    trim: true
  },
  postUrl: {
    type: String,
    trim: true
  },
  analytics: {
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    reach: {
      type: Number,
      default: 0
    },
    impressions: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  errorDetails: {
    message: {
      type: String
    },
    code: {
      type: String
    },
    timestamp: {
      type: Date
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to publish post
SocialMediaPostSchema.methods.publish = async function() {
  try {
    // In a real implementation, this would use the platform's API to publish the post
    // For zero-cost implementation, we'll simulate the publishing
    
    this.status = 'published';
    this.publishedTime = Date.now();
    this.postId = 'mock_post_' + Date.now().toString();
    this.postUrl = `https://example.com/${this.account.platform}/posts/${this.postId}`;
    
    await this.save();
    return true;
  } catch (error) {
    this.status = 'failed';
    this.errorDetails = {
      message: error.message,
      code: error.code || 'UNKNOWN',
      timestamp: Date.now()
    };
    await this.save();
    return false;
  }
};

// Method to update analytics
SocialMediaPostSchema.methods.updateAnalytics = async function() {
  try {
    // In a real implementation, this would fetch analytics from the platform's API
    // For zero-cost implementation, we'll simulate analytics data
    
    if (this.status !== 'published') {
      return false;
    }
    
    // Calculate time since publishing
    const now = new Date();
    const hoursSincePublished = (now - this.publishedTime) / (1000 * 60 * 60);
    
    // Simulate analytics growth over time
    this.analytics = {
      likes: Math.floor(10 * Math.sqrt(hoursSincePublished)),
      shares: Math.floor(3 * Math.sqrt(hoursSincePublished)),
      comments: Math.floor(5 * Math.sqrt(hoursSincePublished)),
      clicks: Math.floor(8 * Math.sqrt(hoursSincePublished)),
      reach: Math.floor(100 * Math.sqrt(hoursSincePublished)),
      impressions: Math.floor(150 * Math.sqrt(hoursSincePublished)),
      lastUpdated: now
    };
    
    await this.save();
    return true;
  } catch (error) {
    console.error('Error updating analytics:', error);
    return false;
  }
};

// Static method to find posts by account
SocialMediaPostSchema.statics.findByAccount = function(accountId) {
  return this.find({ account: accountId }).sort({ createdAt: -1 });
};

// Static method to find scheduled posts
SocialMediaPostSchema.statics.findScheduledPosts = function() {
  return this.find({ 
    status: 'scheduled',
    scheduledTime: { $lte: new Date() }
  }).populate('account').sort({ scheduledTime: 1 });
};

// Static method to find posts by status
SocialMediaPostSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find posts by campaign
SocialMediaPostSchema.statics.findByCampaign = function(campaignId) {
  return this.find({ campaign: campaignId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('SocialMediaPost', SocialMediaPostSchema);
