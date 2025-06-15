const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  type: {
    type: String,
    required: true,
    enum: ['email', 'social', 'webinar', 'content', 'other'],
    default: 'email'
  },
  targetAudience: {
    type: Object,
    default: {}
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    default: 0
  },
  goals: {
    type: Object,
    default: {
      leads: 0,
      conversions: 0,
      revenue: 0
    }
  },
  performanceMetrics: {
    type: Object,
    default: {
      impressions: 0,
      clicks: 0,
      leads: 0,
      conversions: 0,
      revenue: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
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

// Method to calculate campaign effectiveness
CampaignSchema.methods.calculateEffectiveness = function() {
  const { leads, conversions, revenue } = this.performanceMetrics;
  const budget = this.budget || 1; // Avoid division by zero
  
  const costPerLead = leads > 0 ? budget / leads : 0;
  const costPerConversion = conversions > 0 ? budget / conversions : 0;
  const roi = revenue > 0 ? (revenue - budget) / budget * 100 : 0;
  
  return {
    costPerLead,
    costPerConversion,
    roi,
    conversionRate: leads > 0 ? (conversions / leads) * 100 : 0
  };
};

// Static method to find active campaigns that need attention
CampaignSchema.statics.findNeedingAttention = function() {
  return this.find({
    status: 'active',
    $or: [
      { 'performanceMetrics.leads': { $lt: 5 } },
      { 'performanceMetrics.conversions': { $lt: 1 } }
    ]
  }).sort({ startDate: -1 });
};

module.exports = mongoose.model('Campaign', CampaignSchema);
