const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  period: {
    type: String,
    required: true,
    enum: ['monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  categories: [{
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
      ]
    },
    plannedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    actualAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  totalPlanned: {
    type: Number,
    required: true,
    min: 0
  },
  totalActual: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
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

// Method to calculate budget totals
BudgetSchema.methods.calculateTotals = function() {
  // Calculate total planned amount
  this.totalPlanned = this.categories.reduce((sum, category) => sum + category.plannedAmount, 0);
  
  // Calculate total actual amount
  this.totalActual = this.categories.reduce((sum, category) => sum + category.actualAmount, 0);
  
  return this;
};

// Method to update actual expenses from expense records
BudgetSchema.methods.updateActualExpenses = async function() {
  const Expense = mongoose.model('Expense');
  
  // Find all expenses within the budget period
  const expenses = await Expense.find({
    date: {
      $gte: this.startDate,
      $lte: this.endDate
    },
    status: 'approved'
  });
  
  // Reset actual amounts
  this.categories.forEach(category => {
    category.actualAmount = 0;
  });
  
  // Update actual amounts based on expenses
  expenses.forEach(expense => {
    const categoryIndex = this.categories.findIndex(c => c.category === expense.category);
    
    if (categoryIndex !== -1) {
      this.categories[categoryIndex].actualAmount += expense.amount;
    }
  });
  
  // Recalculate totals
  this.calculateTotals();
  
  return this;
};

// Method to calculate variance (difference between planned and actual)
BudgetSchema.methods.calculateVariance = function() {
  const variance = {
    total: this.totalPlanned - this.totalActual,
    categories: []
  };
  
  this.categories.forEach(category => {
    variance.categories.push({
      category: category.category,
      amount: category.plannedAmount - category.actualAmount,
      percentage: category.plannedAmount > 0 
        ? ((category.plannedAmount - category.actualAmount) / category.plannedAmount) * 100 
        : 0
    });
  });
  
  return variance;
};

// Static method to find active budgets
BudgetSchema.statics.findActiveBudgets = function() {
  const today = new Date();
  
  return this.find({
    status: 'active',
    startDate: { $lte: today },
    endDate: { $gte: today }
  });
};

// Static method to find budgets by date range
BudgetSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { 
        $and: [
          { startDate: { $lte: startDate } },
          { endDate: { $gte: endDate } }
        ]
      }
    ]
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('Budget', BudgetSchema);
