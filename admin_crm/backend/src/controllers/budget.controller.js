const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Controller methods for budget management
const budgetController = {
  // Get all budgets
  getBudgets: async (req, res) => {
    try {
      const budgets = await Budget.find().sort({ startDate: -1 });
      res.json(budgets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get budget by ID
  getBudgetById: async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      res.json(budget);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new budget
  createBudget: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        name, 
        description, 
        period, 
        startDate, 
        endDate, 
        categories, 
        status 
      } = req.body;
      
      // Calculate total planned amount
      const totalPlanned = categories.reduce((sum, category) => sum + category.plannedAmount, 0);
      
      // Create new budget
      const budget = new Budget({
        name,
        description,
        period,
        startDate,
        endDate,
        categories,
        totalPlanned,
        totalActual: 0,
        status: status || 'draft',
        createdBy: req.user.id
      });
      
      await budget.save();
      
      res.json(budget);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a budget
  updateBudget: async (req, res) => {
    try {
      const { 
        name, 
        description, 
        period, 
        startDate, 
        endDate, 
        categories 
      } = req.body;
      
      // Find budget by ID
      let budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      // Check if budget is already closed
      if (budget.status === 'closed') {
        return res.status(400).json({ msg: 'Cannot modify a closed budget' });
      }
      
      // Update fields
      if (name) budget.name = name;
      if (description) budget.description = description;
      if (period) budget.period = period;
      if (startDate) budget.startDate = startDate;
      if (endDate) budget.endDate = endDate;
      if (categories) {
        budget.categories = categories;
        budget.totalPlanned = categories.reduce((sum, category) => sum + category.plannedAmount, 0);
      }
      
      budget.updatedAt = Date.now();
      
      await budget.save();
      
      res.json(budget);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a budget
  deleteBudget: async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      // Check if budget is already active or closed
      if (['active', 'closed'].includes(budget.status)) {
        return res.status(400).json({ msg: 'Cannot delete an active or closed budget' });
      }
      
      await budget.remove();
      
      res.json({ msg: 'Budget removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Activate a budget
  activateBudget: async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      // Check if budget is already active or closed
      if (budget.status === 'active') {
        return res.status(400).json({ msg: 'Budget is already active' });
      }
      if (budget.status === 'closed') {
        return res.status(400).json({ msg: 'Cannot activate a closed budget' });
      }
      
      // Update status
      budget.status = 'active';
      budget.updatedAt = Date.now();
      
      await budget.save();
      
      res.json(budget);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Close a budget
  closeBudget: async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      // Check if budget is already closed
      if (budget.status === 'closed') {
        return res.status(400).json({ msg: 'Budget is already closed' });
      }
      
      // Update status
      budget.status = 'closed';
      budget.updatedAt = Date.now();
      
      // Update actual expenses one last time
      await budget.updateActualExpenses();
      
      await budget.save();
      
      res.json(budget);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get budget variance
  getBudgetVariance: async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      // Calculate variance
      const variance = budget.calculateVariance();
      
      res.json(variance);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Update actual expenses from expense records
  updateActualExpenses: async (req, res) => {
    try {
      const budget = await Budget.findById(req.params.id);
      
      if (!budget) {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      
      // Update actual expenses
      await budget.updateActualExpenses();
      
      await budget.save();
      
      res.json(budget);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Budget not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get all active budgets
  getActiveBudgets: async (req, res) => {
    try {
      const budgets = await Budget.findActiveBudgets();
      res.json(budgets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get budgets by date range
  getBudgetsByDateRange: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { startDate, endDate } = req.body;
      
      const budgets = await Budget.findByDateRange(new Date(startDate), new Date(endDate));
      res.json(budgets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = budgetController;
