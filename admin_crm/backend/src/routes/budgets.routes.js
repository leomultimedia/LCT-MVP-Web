const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const budgetController = require('../controllers/budget.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/budgets
// @desc    Get all budgets
// @access  Private
router.get('/', auth, budgetController.getBudgets);

// @route   GET api/budgets/:id
// @desc    Get budget by ID
// @access  Private
router.get('/:id', auth, budgetController.getBudgetById);

// @route   POST api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('period', 'Period is required').not().isEmpty(),
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty(),
    check('categories', 'At least one category is required').isArray({ min: 1 })
  ]
], budgetController.createBudget);

// @route   PUT api/budgets/:id
// @desc    Update a budget
// @access  Private
router.put('/:id', auth, budgetController.updateBudget);

// @route   DELETE api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, budgetController.deleteBudget);

// @route   POST api/budgets/:id/activate
// @desc    Activate a budget
// @access  Private
router.post('/:id/activate', auth, budgetController.activateBudget);

// @route   POST api/budgets/:id/close
// @desc    Close a budget
// @access  Private
router.post('/:id/close', auth, budgetController.closeBudget);

// @route   GET api/budgets/:id/variance
// @desc    Get budget variance
// @access  Private
router.get('/:id/variance', auth, budgetController.getBudgetVariance);

// @route   POST api/budgets/:id/update-actuals
// @desc    Update actual expenses from expense records
// @access  Private
router.post('/:id/update-actuals', auth, budgetController.updateActualExpenses);

// @route   GET api/budgets/active
// @desc    Get all active budgets
// @access  Private
router.get('/active', auth, budgetController.getActiveBudgets);

// @route   GET api/budgets/date-range
// @desc    Get budgets by date range
// @access  Private
router.get('/date-range', [
  auth,
  [
    check('startDate', 'Start date is required').not().isEmpty(),
    check('endDate', 'End date is required').not().isEmpty()
  ]
], budgetController.getBudgetsByDateRange);

module.exports = router;
