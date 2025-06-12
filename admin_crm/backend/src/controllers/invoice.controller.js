const Invoice = require('../models/Invoice');
const { validationResult } = require('express-validator');

// Controller methods for invoice management
const invoiceController = {
  // Get all invoices
  getInvoices: async (req, res) => {
    try {
      const invoices = await Invoice.find().sort({ createdAt: -1 });
      res.json(invoices);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get invoice by ID
  getInvoiceById: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new invoice
  createInvoice: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        client, 
        issueDate, 
        dueDate, 
        items, 
        subtotal, 
        taxRate, 
        taxAmount, 
        discount, 
        total, 
        notes, 
        status, 
        paymentDetails 
      } = req.body;
      
      // Generate invoice number
      const invoiceNumber = await Invoice.generateInvoiceNumber();
      
      // Create new invoice
      const invoice = new Invoice({
        invoiceNumber,
        client,
        issueDate: issueDate || Date.now(),
        dueDate,
        items,
        subtotal: subtotal || 0,
        taxRate: taxRate || 0,
        taxAmount: taxAmount || 0,
        discount: discount || 0,
        total: total || 0,
        notes,
        status: status || 'draft',
        paymentDetails,
        createdBy: req.user.id
      });
      
      // Calculate totals if not provided
      if (!subtotal || !total) {
        invoice.calculateTotals();
      }
      
      await invoice.save();
      
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update an invoice
  updateInvoice: async (req, res) => {
    try {
      const { 
        client, 
        issueDate, 
        dueDate, 
        items, 
        subtotal, 
        taxRate, 
        taxAmount, 
        discount, 
        total, 
        notes, 
        status, 
        paymentDetails 
      } = req.body;
      
      // Find invoice by ID
      let invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      
      // Check if invoice is already paid
      if (invoice.status === 'paid' && status !== 'paid') {
        return res.status(400).json({ msg: 'Cannot modify a paid invoice' });
      }
      
      // Update fields
      if (client) invoice.client = client;
      if (issueDate) invoice.issueDate = issueDate;
      if (dueDate) invoice.dueDate = dueDate;
      if (items) invoice.items = items;
      if (subtotal !== undefined) invoice.subtotal = subtotal;
      if (taxRate !== undefined) invoice.taxRate = taxRate;
      if (taxAmount !== undefined) invoice.taxAmount = taxAmount;
      if (discount !== undefined) invoice.discount = discount;
      if (total !== undefined) invoice.total = total;
      if (notes) invoice.notes = notes;
      if (status) invoice.status = status;
      if (paymentDetails) invoice.paymentDetails = paymentDetails;
      
      // Recalculate totals if items were updated
      if (items) {
        invoice.calculateTotals();
      }
      
      invoice.updatedAt = Date.now();
      
      await invoice.save();
      
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete an invoice
  deleteInvoice: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      
      // Check if invoice is already paid
      if (invoice.status === 'paid') {
        return res.status(400).json({ msg: 'Cannot delete a paid invoice' });
      }
      
      await invoice.remove();
      
      res.json({ msg: 'Invoice removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Send invoice to client
  sendInvoice: async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      
      // Update status to sent
      invoice.status = 'sent';
      invoice.updatedAt = Date.now();
      
      // In a real implementation, this would send an email to the client
      // For zero-cost implementation, we'll just log it
      console.log(`Invoice ${invoice.invoiceNumber} would be sent to ${invoice.client.email}`);
      
      await invoice.save();
      
      res.json({ success: true, invoice });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Mark invoice as paid
  markAsPaid: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { paymentDetails } = req.body;
      
      const invoice = await Invoice.findById(req.params.id);
      
      if (!invoice) {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      
      // Update status and payment details
      invoice.status = 'paid';
      invoice.paymentDetails = paymentDetails;
      invoice.updatedAt = Date.now();
      
      await invoice.save();
      
      res.json(invoice);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get all overdue invoices
  getOverdueInvoices: async (req, res) => {
    try {
      const overdueInvoices = await Invoice.findOverdueInvoices();
      res.json(overdueInvoices);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Generate a new invoice number
  generateInvoiceNumber: async (req, res) => {
    try {
      const invoiceNumber = await Invoice.generateInvoiceNumber();
      res.json({ invoiceNumber });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = invoiceController;
