const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const invoiceController = require('../controllers/invoice.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/invoices
// @desc    Get all invoices
// @access  Private
router.get('/', auth, invoiceController.getInvoices);

// @route   GET api/invoices/:id
// @desc    Get invoice by ID
// @access  Private
router.get('/:id', auth, invoiceController.getInvoiceById);

// @route   POST api/invoices
// @desc    Create a new invoice
// @access  Private
router.post('/', [
  auth,
  [
    check('client.name', 'Client name is required').not().isEmpty(),
    check('client.email', 'Please include a valid email').isEmail(),
    check('items', 'At least one item is required').isArray({ min: 1 }),
    check('dueDate', 'Due date is required').not().isEmpty()
  ]
], invoiceController.createInvoice);

// @route   PUT api/invoices/:id
// @desc    Update an invoice
// @access  Private
router.put('/:id', auth, invoiceController.updateInvoice);

// @route   DELETE api/invoices/:id
// @desc    Delete an invoice
// @access  Private
router.delete('/:id', auth, invoiceController.deleteInvoice);

// @route   POST api/invoices/:id/send
// @desc    Send invoice to client
// @access  Private
router.post('/:id/send', auth, invoiceController.sendInvoice);

// @route   POST api/invoices/:id/mark-paid
// @desc    Mark invoice as paid
// @access  Private
router.post('/:id/mark-paid', [
  auth,
  [
    check('paymentDetails.method', 'Payment method is required').not().isEmpty(),
    check('paymentDetails.paymentDate', 'Payment date is required').not().isEmpty()
  ]
], invoiceController.markAsPaid);

// @route   GET api/invoices/overdue
// @desc    Get all overdue invoices
// @access  Private
router.get('/overdue', auth, invoiceController.getOverdueInvoices);

// @route   GET api/invoices/generate-number
// @desc    Generate a new invoice number
// @access  Private
router.get('/generate-number', auth, invoiceController.generateInvoiceNumber);

module.exports = router;
