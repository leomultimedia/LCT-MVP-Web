const FinancialAccount = require('../models/FinancialAccount');
const { validationResult } = require('express-validator');

// Controller methods for financial account management
const financialAccountController = {
  // Get all financial accounts
  getAccounts: async (req, res) => {
    try {
      const accounts = await FinancialAccount.find({ isActive: true }).sort({ name: 1 });
      res.json(accounts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get financial account by ID
  getAccountById: async (req, res) => {
    try {
      const account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new financial account
  createAccount: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        name, 
        accountNumber, 
        type, 
        currency, 
        openingBalance, 
        description 
      } = req.body;
      
      // Create new financial account
      const account = new FinancialAccount({
        name,
        accountNumber,
        type,
        currency,
        openingBalance,
        currentBalance: openingBalance,
        description,
        isActive: true,
        createdBy: req.user.id
      });
      
      await account.save();
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a financial account
  updateAccount: async (req, res) => {
    try {
      const { 
        name, 
        accountNumber, 
        type, 
        currency, 
        description, 
        isActive 
      } = req.body;
      
      // Find financial account by ID
      let account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      // Update fields
      if (name) account.name = name;
      if (accountNumber) account.accountNumber = accountNumber;
      if (type) account.type = type;
      if (currency) account.currency = currency;
      if (description !== undefined) account.description = description;
      if (isActive !== undefined) account.isActive = isActive;
      
      account.updatedAt = Date.now();
      
      await account.save();
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a financial account
  deleteAccount: async (req, res) => {
    try {
      const account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      // Instead of deleting, mark as inactive
      account.isActive = false;
      account.updatedAt = Date.now();
      
      await account.save();
      
      res.json({ msg: 'Financial account deactivated' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Add a transaction to an account
  addTransaction: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        description, 
        amount, 
        type, 
        date, 
        reference, 
        relatedTo 
      } = req.body;
      
      const account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      // Create transaction
      const transaction = {
        date: date || Date.now(),
        description,
        amount,
        type,
        reference,
        relatedTo
      };
      
      // Add transaction and update balance
      account.addTransaction(transaction);
      
      await account.save();
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get all transactions for an account
  getTransactions: async (req, res) => {
    try {
      const account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      // Sort transactions by date (newest first)
      const transactions = account.transactions.sort((a, b) => b.date - a.date);
      
      res.json(transactions);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get account balance at a specific date
  getBalanceAtDate: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { date } = req.body;
      
      const account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      // Get balance at date
      const balance = account.getBalanceAtDate(new Date(date));
      
      res.json({ balance });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get transactions by date range
  getTransactionsByDateRange: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { startDate, endDate } = req.body;
      
      const account = await FinancialAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      
      // Get transactions by date range
      const transactions = account.getTransactionsByDateRange(new Date(startDate), new Date(endDate));
      
      res.json(transactions);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Financial account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get accounts by type
  getAccountsByType: async (req, res) => {
    try {
      const accounts = await FinancialAccount.findByType(req.params.type);
      res.json(accounts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get total balance across all accounts
  getTotalBalance: async (req, res) => {
    try {
      const totalBalance = await FinancialAccount.calculateTotalBalance();
      res.json({ totalBalance });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = financialAccountController;
