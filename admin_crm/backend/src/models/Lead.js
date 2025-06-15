const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    required: true,
    enum: ['website', 'referral', 'social_media', 'email_campaign', 'webinar', 'other'],
    default: 'website'
  },
  score: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    default: 'new'
  },
  stageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PipelineStage'
  },
  notes: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  activities: [{
    type: {
      type: String,
      enum: ['email', 'call', 'meeting', 'task', 'note'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update lastActivity on save
LeadSchema.pre('save', function(next) {
  this.lastActivity = Date.now();
  next();
});

// Method to calculate lead score based on activities and profile
LeadSchema.methods.calculateScore = function() {
  let score = 0;
  
  // Score based on profile completeness
  if (this.email) score += 10;
  if (this.name) score += 5;
  if (this.company) score += 10;
  if (this.phone) score += 15;
  
  // Score based on activities
  const emailCount = this.activities.filter(a => a.type === 'email').length;
  const callCount = this.activities.filter(a => a.type === 'call').length;
  const meetingCount = this.activities.filter(a => a.type === 'meeting').length;
  
  score += emailCount * 5;
  score += callCount * 10;
  score += meetingCount * 20;
  
  // Cap score at 100
  return Math.min(score, 100);
};

// Static method to find leads that need follow-up
LeadSchema.statics.findNeedingFollowUp = function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return this.find({
    lastActivity: { $lt: oneWeekAgo },
    status: { $nin: ['won', 'lost'] }
  }).sort({ score: -1 });
};

module.exports = mongoose.model('Lead', LeadSchema);
