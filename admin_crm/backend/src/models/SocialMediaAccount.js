const mongoose = require('mongoose');

const SocialMediaAccountSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'other'],
    default: 'other'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  handle: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  credentials: {
    // In a production environment, these would be encrypted
    // For zero-cost implementation, we'll store API tokens securely
    apiKey: {
      type: String,
      trim: true
    },
    apiSecret: {
      type: String,
      trim: true
    },
    accessToken: {
      type: String,
      trim: true
    },
    accessTokenSecret: {
      type: String,
      trim: true
    },
    refreshToken: {
      type: String,
      trim: true
    }
  },
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'pending', 'error'],
    default: 'disconnected'
  },
  lastConnectionCheck: {
    type: Date
  },
  connectionError: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
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

// Method to check connection status
SocialMediaAccountSchema.methods.checkConnection = async function() {
  try {
    // In a real implementation, this would use the platform's API to check connection
    // For zero-cost implementation, we'll simulate the check
    const isConnected = this.credentials.apiKey && this.credentials.accessToken;
    
    this.connectionStatus = isConnected ? 'connected' : 'disconnected';
    this.lastConnectionCheck = Date.now();
    this.connectionError = isConnected ? null : 'Missing API credentials';
    
    await this.save();
    return this.connectionStatus === 'connected';
  } catch (error) {
    this.connectionStatus = 'error';
    this.connectionError = error.message;
    await this.save();
    return false;
  }
};

// Static method to find accounts by platform
SocialMediaAccountSchema.statics.findByPlatform = function(platform) {
  return this.find({ platform, isActive: true }).sort({ name: 1 });
};

// Static method to find connected accounts
SocialMediaAccountSchema.statics.findConnectedAccounts = function() {
  return this.find({ connectionStatus: 'connected', isActive: true }).sort({ platform: 1 });
};

module.exports = mongoose.model('SocialMediaAccount', SocialMediaAccountSchema);
