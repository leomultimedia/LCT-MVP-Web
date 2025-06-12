const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Controller methods for expense management
const expenseController = {
  // Get all expenses
  getExpenses: async (req, res) => {
    try {
      const expenses = await Expense.find().sort({ date: -1 });
      res.json(expenses);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get expense by ID
  getExpenseById: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      
      res.json(expense);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new expense
  createExpense: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        description, 
        amount, 
        date, 
        category, 
        paymentMethod, 
        receipt, 
        notes, 
        isRecurring, 
        recurringDetails 
      } = req.body;
      
      // Create new expense
      const expense = new Expense({
        description,
        amount,
        date,
        category,
        paymentMethod,
        receipt,
        notes,
        isRecurring: isRecurring || false,
        recurringDetails,
        status: 'pending',
        createdBy: req.user.id
      });
      
      await expense.save();
      
      res.json(expense);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update an expense
  updateExpense: async (req, res) => {
    try {
      const { 
        description, 
        amount, 
        date, 
        category, 
        paymentMethod, 
        receipt, 
        notes, 
        isRecurring, 
        recurringDetails 
      } = req.body;
      
      // Find expense by ID
      let expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      
      // Check if expense is already approved or paid
      if (['approved', 'paid'].includes(expense.status)) {
        return res.status(400).json({ msg: 'Cannot modify an approved or paid expense' });
      }
      
      // Update fields
      if (description) expense.description = description;
      if (amount) expense.amount = amount;
      if (date) expense.date = date;
      if (category) expense.category = category;
      if (paymentMethod) expense.paymentMethod = paymentMethod;
      if (receipt) expense.receipt = receipt;
      if (notes) expense.notes = notes;
      if (isRecurring !== undefined) expense.isRecurring = isRecurring;
      if (recurringDetails) expense.recurringDetails = recurringDetails;
      
      expense.updatedAt = Date.now();
      
      await expense.save();
      
      res.json(expense);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete an expense
  deleteExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      
      // Check if expense is already approved or paid
      if (['approved', 'paid'].includes(expense.status)) {
        return res.status(400).json({ msg: 'Cannot delete an approved or paid expense' });
      }
      
      await expense.remove();
      
      res.json({ msg: 'Expense removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Approve an expense
  approveExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      
      // Update status and approver
      expense.status = 'approved';
      expense.approvedBy = req.user.id;
      expense.updatedAt = Date.now();
      
      await expense.save();
      
      res.json(expense);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Reject an expense
  rejectExpense: async (req, res) => {
    try {
      const expense = await Expense.findById(req.params.id);
      
      if (!expense) {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      
      // Update status
      expense.status = 'rejected';
      expense.updatedAt = Date.now();
      
      await expense.save();
      
      res.json(expense);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Expense not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get expenses by category
  getExpensesByCategory: async (req, res) => {
    try {
      const expenses = await Expense.findByCategory(req.params.category);
      res.json(expenses);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get expenses by date range
  getExpensesByDateRange: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { startDate, endDate } = req.body;
      
      const expenses = await Expense.findByDateRange(new Date(startDate), new Date(endDate));
      res.json(expenses);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get recurring expenses due soon
  getRecurringExpensesDueSoon: async (req, res) => {
    try {
      const daysThreshold = req.query.days ? parseInt(req.query.days) : 7;
      const expenses = await Expense.findRecurringDueSoon(daysThreshold);
      res.json(expenses);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = expenseController;
