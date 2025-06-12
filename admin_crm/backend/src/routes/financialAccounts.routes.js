const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const financialAccountController = require('../controllers/financialAccount.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/accounts
// @desc    Get all financial accounts
// @access  Private
router.get('/', auth, financialAccountController.getAccounts);

// @route   GET api/accounts/:id
// @desc    Get financial account by ID
// @access  Private
router.get('/:id', auth, financialAccountController.getAccountById);

// @route   POST api/accounts
// @desc    Create a new financial account
// @access  Private
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
    check('currency', 'Currency is required').not().isEmpty(),
    check('openingBalance', 'Opening balance is required').isNumeric()
  ]
], financialAccountController.createAccount);

// @route   PUT api/accounts/:id
// @desc    Update a financial account
// @access  Private
router.put('/:id', auth, financialAccountController.updateAccount);

// @route   DELETE api/accounts/:id
// @desc    Delete a financial account
// @access  Private
router.delete('/:id', auth, financialAccountController.deleteAccount);

// @route   POST api/accounts/:id/transactions
// @desc    Add a transaction to an account
// @access  Private
router.post('/:id/transactions', [
  auth,
  [
    check('description', 'Description is required').not().isEmpty(),
    check('amount', 'Amount is required and must be a number').isNumeric(),
    check('type', 'Transaction type is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty()
  ]
], financialAccountController.addTransaction);

// @route   GET api/accounts/:id/transactions
// @desc    Get all transactions for an account
// @access  Private
router.get('/:id/transactions', auth, financialAccountController.getTransactions);

// @route   GET api/accounts/:id/balance
// @desc    Get account balance at a specific date
// @access  Private
router.get('/:id/balance', [
  auth,
  [
    check('date', 'Date is required').not().isEmpty()
  ]
], financialAccountController.getBalanceAtDate);

// @route   GET api/accounts/:id/transactions/date-range
// @desc    Get transactions by date range
// @access  Private
router.get('/:id/transactions/date-range', [
  auth,
  [
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty()
  ]
], financialAccountController.getTransactionsByDateRange);

// @route   GET api/accounts/type/:type
// @desc    Get accounts by type
// @access  Private
router.get('/type/:type', auth, financialAccountController.getAccountsByType);

// @route   GET api/accounts/total-balance
// @desc    Get total balance across all accounts
// @access  Private
router.get('/total-balance', auth, financialAccountController.getTotalBalance);

module.exports = router;
