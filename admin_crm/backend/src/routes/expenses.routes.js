const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const expenseController = require('../controllers/expense.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', auth, expenseController.getExpenses);

// @route   GET api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', auth, expenseController.getExpenseById);

// @route   POST api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', [
  auth,
  [
    check('description', 'Description is required').not().isEmpty(),
    check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0 }),
    check('date', 'Date is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ]
], expenseController.createExpense);

// @route   PUT api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', auth, expenseController.updateExpense);

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', auth, expenseController.deleteExpense);

// @route   POST api/expenses/:id/approve
// @desc    Approve an expense
// @access  Private (admin only)
router.post('/:id/approve', auth, expenseController.approveExpense);

// @route   POST api/expenses/:id/reject
// @desc    Reject an expense
// @access  Private (admin only)
router.post('/:id/reject', auth, expenseController.rejectExpense);

// @route   GET api/expenses/category/:category
// @desc    Get expenses by category
// @access  Private
router.get('/category/:category', auth, expenseController.getExpensesByCategory);

// @route   GET api/expenses/date-range
// @desc    Get expenses by date range
// @access  Private
router.get('/date-range', [
  auth,
  [
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty()
  ]
], expenseController.getExpensesByDateRange);

// @route   GET api/expenses/recurring
// @desc    Get recurring expenses due soon
// @access  Private
router.get('/recurring', auth, expenseController.getRecurringExpensesDueSoon);

module.exports = router;
