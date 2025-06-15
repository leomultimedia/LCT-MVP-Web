const mongoose = require('mongoose');

const DashboardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['system', 'sales', 'finance', 'itsm', 'social_media', 'custom'],
    default: 'custom'
  },
  layout: {
    columns: {
      type: Number,
      default: 3,
      min: 1,
      max: 4
    },
    widgets: [{
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: ['chart', 'metric', 'table', 'list', 'status', 'custom']
      },
      dataSource: {
        module: {
          type: String,
          required: true
        },
        endpoint: {
          type: String,
          required: true
        },
        parameters: {
          type: mongoose.Schema.Types.Mixed
        },
        refreshInterval: {
          type: Number, // in seconds
          default: 300 // 5 minutes
        }
      },
      visualization: {
        type: {
          type: String,
          enum: ['line', 'bar', 'pie', 'table', 'number', 'status', 'list', 'custom']
        },
        options: {
          type: mongoose.Schema.Types.Mixed
        }
      },
      position: {
        row: {
          type: Number,
          required: true
        },
        col: {
          type: Number,
          required: true
        },
        width: {
          type: Number,
          default: 1
        },
        height: {
          type: Number,
          default: 1
        }
      }
    }]
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
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

// Method to add a widget
DashboardSchema.methods.addWidget = function(widget) {
  this.layout.widgets.push(widget);
  this.updatedAt = Date.now();
  return this;
};

// Method to update a widget
DashboardSchema.methods.updateWidget = function(widgetId, updates) {
  const widgetIndex = this.layout.widgets.findIndex(w => w.id === widgetId);
  
  if (widgetIndex === -1) {
    return false;
  }
  
  this.layout.widgets[widgetIndex] = {
    ...this.layout.widgets[widgetIndex],
    ...updates
  };
  
  this.updatedAt = Date.now();
  return true;
};

// Method to remove a widget
DashboardSchema.methods.removeWidget = function(widgetId) {
  const initialLength = this.layout.widgets.length;
  this.layout.widgets = this.layout.widgets.filter(w => w.id !== widgetId);
  
  if (this.layout.widgets.length < initialLength) {
    this.updatedAt = Date.now();
    return true;
  }
  
  return false;
};

// Static method to find dashboards by type
DashboardSchema.statics.findByType = function(type) {
  return this.find({ type }).sort({ name: 1 });
};

// Static method to find dashboards by owner
DashboardSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId }).sort({ updatedAt: -1 });
};

// Static method to find public dashboards
DashboardSchema.statics.findPublicDashboards = function() {
  return this.find({ isPublic: true }).sort({ name: 1 });
};

// Static method to find default dashboard
DashboardSchema.statics.findDefaultDashboard = function() {
  return this.findOne({ isDefault: true });
};

module.exports = mongoose.model('Dashboard', DashboardSchema);
