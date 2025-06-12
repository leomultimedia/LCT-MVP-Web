const Ticket = require('../models/Ticket');
const { validationResult } = require('express-validator');

// Controller methods for ticket management
const ticketController = {
  // Get all tickets
  getTickets: async (req, res) => {
    try {
      const tickets = await Ticket.find().sort({ createdAt: -1 });
      res.json(tickets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get ticket by ID
  getTicketById: async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      
      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new ticket
  createTicket: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        subject, 
        description, 
        priority, 
        category, 
        requester,
        sla 
      } = req.body;
      
      // Generate ticket number
      const ticketNumber = await Ticket.generateTicketNumber();
      
      // Create new ticket
      const ticket = new Ticket({
        ticketNumber,
        subject,
        description,
        priority: priority || 'medium',
        category: category || 'other',
        requester,
        status: 'open'
      });
      
      // Set SLA if provided
      if (sla) {
        ticket.sla = {
          ...ticket.sla,
          ...sla
        };
      }
      
      // Calculate SLA deadlines
      ticket.calculateSLADeadlines();
      
      await ticket.save();
      
      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a ticket
  updateTicket: async (req, res) => {
    try {
      const { 
        subject, 
        description, 
        priority, 
        category, 
        requester,
        sla 
      } = req.body;
      
      // Find ticket by ID
      let ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      
      // Update fields
      if (subject) ticket.subject = subject;
      if (description) ticket.description = description;
      if (priority) ticket.priority = priority;
      if (category) ticket.category = category;
      if (requester) ticket.requester = requester;
      if (sla) {
        ticket.sla = {
          ...ticket.sla,
          ...sla
        };
        
        // Recalculate SLA deadlines if needed
        if (sla.responseTime || sla.resolutionTime) {
          ticket.calculateSLADeadlines();
        }
      }
      
      ticket.updatedAt = Date.now();
      
      await ticket.save();
      
      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a ticket
  deleteTicket: async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      
      // Check if user is admin (simplified for now)
      if (req.user.role !== 'admin') {
        return res.status(401).json({ msg: 'Not authorized to delete tickets' });
      }
      
      await ticket.remove();
      
      res.json({ msg: 'Ticket removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Add a comment to a ticket
  addComment: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { text, isInternal } = req.body;
      
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      
      // Create comment
      const comment = {
        text,
        createdBy: req.user.id,
        isInternal: isInternal || false,
        createdAt: Date.now()
      };
      
      // Add comment to ticket
      ticket.addComment(comment);
      
      await ticket.save();
      
      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Update ticket status
  updateStatus: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { status } = req.body;
      
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      
      // Update status
      ticket.updateStatus(status, req.user.id);
      
      await ticket.save();
      
      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Assign ticket to a user
  assignTicket: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { userId } = req.body;
      
      const ticket = await Ticket.findById(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      
      // Update assigned user
      ticket.assignedTo = userId;
      ticket.updatedAt = Date.now();
      
      // Add a system comment about the assignment
      ticket.comments.push({
        text: `Ticket assigned to user ID: ${userId}`,
        createdBy: req.user.id,
        isInternal: true,
        createdAt: Date.now()
      });
      
      await ticket.save();
      
      res.json(ticket);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Ticket not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get tickets by status
  getTicketsByStatus: async (req, res) => {
    try {
      const tickets = await Ticket.findByStatus(req.params.status);
      res.json(tickets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get tickets by priority
  getTicketsByPriority: async (req, res) => {
    try {
      const tickets = await Ticket.findByPriority(req.params.priority);
      res.json(tickets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get tickets assigned to a user
  getTicketsByAssignee: async (req, res) => {
    try {
      const tickets = await Ticket.findByAssignee(req.params.userId);
      res.json(tickets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get tickets with breached SLA
  getBreachedSLATickets: async (req, res) => {
    try {
      const tickets = await Ticket.findBreachedSLA();
      res.json(tickets);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Generate a new ticket number
  generateTicketNumber: async (req, res) => {
    try {
      const ticketNumber = await Ticket.generateTicketNumber();
      res.json({ ticketNumber });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = ticketController;
