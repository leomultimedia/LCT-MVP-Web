const mongoose = require('mongoose');

const SystemMetricSchema = new mongoose.Schema({
  metricType: {
    type: String,
    required: true,
    enum: ['system_health', 'module_performance', 'user_activity', 'error_log', 'security_event'],
    default: 'system_health'
  },
  module: {
    type: String,
    required: true,
    enum: ['sales_funnel', 'accounting_finance', 'itsm_ticketing', 'social_media', 'system_wide'],
    default: 'system_wide'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient querying
SystemMetricSchema.index({ metricType: 1, module: 1, timestamp: -1 });

// Static method to record a new metric
SystemMetricSchema.statics.recordMetric = async function(metricType, module, name, value, unit, metadata) {
  try {
    const metric = new this({
      metricType,
      module,
      name,
      value,
      unit,
      metadata,
      timestamp: Date.now()
    });
    
    await metric.save();
    return metric;
  } catch (error) {
    console.error('Error recording metric:', error);
    return null;
  }
};

// Static method to get metrics by type and module
SystemMetricSchema.statics.getMetricsByTypeAndModule = function(metricType, module, limit = 100) {
  return this.find({ metricType, module })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get metrics by time range
SystemMetricSchema.statics.getMetricsByTimeRange = function(startTime, endTime, metricType, module) {
  const query = {
    timestamp: {
      $gte: startTime,
      $lte: endTime
    }
  };
  
  if (metricType) query.metricType = metricType;
  if (module) query.module = module;
  
  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get latest metrics
SystemMetricSchema.statics.getLatestMetrics = function(limit = 20) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get error logs
SystemMetricSchema.statics.getErrorLogs = function(limit = 50) {
  return this.find({ metricType: 'error_log' })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get security events
SystemMetricSchema.statics.getSecurityEvents = function(limit = 50) {
  return this.find({ metricType: 'security_event' })
    .sort({ timestamp: -1 })
    .limit(limit);
};

module.exports = mongoose.model('SystemMetric', SystemMetricSchema);
