const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    required: true,
    enum: [
      'office_supplies',
      'utilities',
      'rent',
      'salaries',
      'marketing',
      'travel',
      'software',
      'hardware',
      'professional_services',
      'taxes',
      'insurance',
      'maintenance',
      'other'
    ],
    default: 'other'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'check', 'other'],
    default: 'other'
  },
  receipt: {
    type: String, // URL or file path to receipt image
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'none'],
      default: 'none'
    },
    nextDueDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Method to check if expense is tax deductible (simplified example)
ExpenseSchema.methods.isTaxDeductible = function() {
  const deductibleCategories = [
    'office_supplies',
    'utilities',
    'rent',
    'marketing',
    'travel',
    'software',
    'hardware',
    'professional_services',
    'insurance',
    'maintenance'
  ];
  
  return deductibleCategories.includes(this.category);
};

// Static method to find expenses by date range
ExpenseSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

// Static method to find expenses by category
ExpenseSchema.statics.findByCategory = function(category) {
  return this.find({ category }).sort({ date: -1 });
};

// Static method to find recurring expenses due soon
ExpenseSchema.statics.findRecurringDueSoon = function(daysThreshold = 7) {
  const today = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(today.getDate() + daysThreshold);
  
  return this.find({
    isRecurring: true,
    'recurringDetails.nextDueDate': {
      $gte: today,
      $lte: thresholdDate
    }
  }).sort({ 'recurringDetails.nextDueDate': 1 });
};

module.exports = mongoose.model('Expense', ExpenseSchema);
