const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  client: {
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
    address: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  items: [{
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'paypal', 'cash', 'other'],
      default: 'bank_transfer'
    },
    bankAccount: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date
    },
    transactionId: {
      type: String,
      trim: true
    }
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

// Method to calculate invoice totals
InvoiceSchema.methods.calculateTotals = function() {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  
  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discount;
  
  return this;
};

// Method to check if invoice is overdue
InvoiceSchema.methods.isOverdue = function() {
  return this.status !== 'paid' && this.dueDate < new Date();
};

// Static method to find overdue invoices
InvoiceSchema.statics.findOverdueInvoices = function() {
  const today = new Date();
  return this.find({
    status: { $nin: ['paid', 'cancelled'] },
    dueDate: { $lt: today }
  }).sort({ dueDate: 1 });
};

// Static method to generate invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function() {
  const lastInvoice = await this.findOne().sort({ createdAt: -1 });
  
  if (!lastInvoice) {
    return 'INV-0001';
  }
  
  const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
  const newNumber = lastNumber + 1;
  
  return `INV-${newNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Invoice', InvoiceSchema);
