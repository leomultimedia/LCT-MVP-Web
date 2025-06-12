const mongoose = require('mongoose');

const FinancialAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bank', 'cash', 'credit_card', 'loan', 'investment', 'other'],
    default: 'bank'
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  openingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'fee', 'interest', 'other'],
      default: 'other'
    },
    reference: {
      type: String,
      trim: true
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['Invoice', 'Expense', 'Transfer', 'Other'],
        default: 'Other'
      },
      id: {
        type: mongoose.Schema.Types.ObjectId
      }
    }
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

// Method to add a transaction
FinancialAccountSchema.methods.addTransaction = function(transaction) {
  // Add transaction to the list
  this.transactions.push(transaction);
  
  // Update current balance
  if (['deposit', 'transfer', 'payment', 'interest'].includes(transaction.type)) {
    this.currentBalance += transaction.amount;
  } else {
    this.currentBalance -= transaction.amount;
  }
  
  return this;
};

// Method to get account balance at a specific date
FinancialAccountSchema.methods.getBalanceAtDate = function(date) {
  let balance = this.openingBalance;
  
  // Add all transactions up to the specified date
  this.transactions
    .filter(transaction => transaction.date <= date)
    .forEach(transaction => {
      if (['deposit', 'transfer', 'payment', 'interest'].includes(transaction.type)) {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    });
  
  return balance;
};

// Method to get transactions by date range
FinancialAccountSchema.methods.getTransactionsByDateRange = function(startDate, endDate) {
  return this.transactions.filter(transaction => 
    transaction.date >= startDate && transaction.date <= endDate
  ).sort((a, b) => b.date - a.date);
};

// Static method to find accounts by type
FinancialAccountSchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true }).sort({ name: 1 });
};

// Static method to calculate total balance across all accounts
FinancialAccountSchema.statics.calculateTotalBalance = async function() {
  const accounts = await this.find({ isActive: true });
  
  return accounts.reduce((total, account) => total + account.currentBalance, 0);
};

module.exports = mongoose.model('FinancialAccount', FinancialAccountSchema);
