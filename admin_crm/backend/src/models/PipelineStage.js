const mongoose = require('mongoose');

const PipelineStageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    required: true
  },
  conversionGoal: {
    type: Number,
    default: 0
  },
  averageDaysInStage: {
    type: Number,
    default: 0
  },
  color: {
    type: String,
    default: '#3498db'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  automationRules: [{
    condition: {
      type: String,
      enum: ['days_in_stage', 'activity_count', 'score_threshold', 'custom'],
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    action: {
      type: String,
      enum: ['move_to_stage', 'assign_to_user', 'send_email', 'create_task', 'update_score'],
      required: true
    },
    actionValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
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

// Method to get leads in this stage
PipelineStageSchema.methods.getLeads = async function() {
  return await mongoose.model('Lead').find({ stageId: this._id });
};

// Method to calculate conversion rate for this stage
PipelineStageSchema.methods.calculateConversionRate = async function() {
  const nextStage = await mongoose.model('PipelineStage').findOne({ 
    order: this.order + 1,
    isActive: true
  });
  
  if (!nextStage) return 0;
  
  const leadsInCurrentStage = await mongoose.model('Lead').countDocuments({ 
    stageId: this._id 
  });
  
  const leadsInNextStage = await mongoose.model('Lead').countDocuments({ 
    stageId: nextStage._id 
  });
  
  return leadsInCurrentStage > 0 ? (leadsInNextStage / leadsInCurrentStage) * 100 : 0;
};

// Static method to get all stages in order
PipelineStageSchema.statics.getOrderedStages = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

module.exports = mongoose.model('PipelineStage', PipelineStageSchema);
