const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  sequenceOrder: {
    type: Number,
    default: 0
  },
  triggerCondition: {
    type: String,
    enum: ['immediate', 'delay', 'action', 'stage_change', 'score_change'],
    default: 'immediate'
  },
  triggerValue: {
    type: mongoose.Schema.Types.Mixed
  },
  isActive: {
    type: Boolean,
    default: true
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

// Method to render template with lead data
EmailTemplateSchema.methods.renderForLead = function(lead) {
  let subject = this.subject;
  let body = this.body;
  
  // Replace placeholders with lead data
  if (lead) {
    const replacements = {
      '{{name}}': lead.name || '',
      '{{email}}': lead.email || '',
      '{{company}}': lead.company || '',
      '{{phone}}': lead.phone || '',
      '{{stage}}': lead.status || '',
      '{{score}}': lead.score || '0'
    };
    
    // Add custom fields
    if (lead.customFields) {
      for (const [key, value] of lead.customFields.entries()) {
        replacements[`{{${key}}}`] = value || '';
      }
    }
    
    // Apply replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }
  }
  
  return { subject, body };
};

// Static method to find templates for a specific trigger
EmailTemplateSchema.statics.findByTrigger = function(triggerType, campaignId) {
  return this.find({
    triggerCondition: triggerType,
    campaignId: campaignId,
    isActive: true
  }).sort({ sequenceOrder: 1 });
};

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
