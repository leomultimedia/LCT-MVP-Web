const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in_progress', 'on_hold', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    enum: ['technical_issue', 'service_request', 'account_access', 'security', 'network', 'software', 'hardware', 'other'],
    default: 'other'
  },
  requester: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    text: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sla: {
    responseTime: {
      type: Number, // in hours
      default: 24
    },
    resolutionTime: {
      type: Number, // in hours
      default: 72
    },
    responseDeadline: {
      type: Date
    },
    resolutionDeadline: {
      type: Date
    },
    isBreached: {
      type: Boolean,
      default: false
    }
  },
  firstResponseTime: {
    type: Date
  },
  resolutionTime: {
    type: Date
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

// Method to add a comment
TicketSchema.methods.addComment = function(comment) {
  this.comments.push(comment);
  this.updatedAt = Date.now();
  
  // If this is the first response and from an agent (not the requester)
  if (!this.firstResponseTime && comment.createdBy) {
    this.firstResponseTime = Date.now();
  }
  
  return this;
};

// Method to update status
TicketSchema.methods.updateStatus = function(status, userId) {
  this.status = status;
  this.updatedAt = Date.now();
  
  // If status is resolved or closed, set resolution time
  if (['resolved', 'closed'].includes(status) && !this.resolutionTime) {
    this.resolutionTime = Date.now();
  }
  
  // Add a system comment about the status change
  this.comments.push({
    text: `Ticket status changed to ${status}`,
    createdBy: userId,
    isInternal: true,
    createdAt: Date.now()
  });
  
  return this;
};

// Method to check if SLA is breached
TicketSchema.methods.checkSLA = function() {
  const now = new Date();
  
  // Check response SLA
  if (this.sla.responseDeadline && !this.firstResponseTime && now > this.sla.responseDeadline) {
    this.sla.isBreached = true;
  }
  
  // Check resolution SLA
  if (this.sla.resolutionDeadline && !this.resolutionTime && now > this.sla.resolutionDeadline) {
    this.sla.isBreached = true;
  }
  
  return this.sla.isBreached;
};

// Method to calculate SLA deadlines
TicketSchema.methods.calculateSLADeadlines = function() {
  const createdAt = this.createdAt;
  
  // Calculate response deadline
  this.sla.responseDeadline = new Date(createdAt);
  this.sla.responseDeadline.setHours(createdAt.getHours() + this.sla.responseTime);
  
  // Calculate resolution deadline
  this.sla.resolutionDeadline = new Date(createdAt);
  this.sla.resolutionDeadline.setHours(createdAt.getHours() + this.sla.resolutionTime);
  
  return this;
};

// Static method to generate ticket number
TicketSchema.statics.generateTicketNumber = async function() {
  const lastTicket = await this.findOne().sort({ createdAt: -1 });
  
  if (!lastTicket) {
    return 'TKT-0001';
  }
  
  const lastNumber = parseInt(lastTicket.ticketNumber.split('-')[1]);
  const newNumber = lastNumber + 1;
  
  return `TKT-${newNumber.toString().padStart(4, '0')}`;
};

// Static method to find tickets by status
TicketSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find tickets by priority
TicketSchema.statics.findByPriority = function(priority) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

// Static method to find tickets assigned to a user
TicketSchema.statics.findByAssignee = function(userId) {
  return this.find({ assignedTo: userId }).sort({ createdAt: -1 });
};

// Static method to find tickets with breached SLA
TicketSchema.statics.findBreachedSLA = function() {
  return this.find({ 'sla.isBreached': true }).sort({ createdAt: 1 });
};

module.exports = mongoose.model('Ticket', TicketSchema);
