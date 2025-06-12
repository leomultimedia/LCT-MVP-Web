const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const ticketController = require('../controllers/ticket.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/tickets
// @desc    Get all tickets
// @access  Private
router.get('/', auth, ticketController.getTickets);

// @route   GET api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', auth, ticketController.getTicketById);

// @route   POST api/tickets
// @desc    Create a new ticket
// @access  Public (can be submitted by non-authenticated users)
router.post('/', [
  check('subject', 'Subject is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('requester.name', 'Requester name is required').not().isEmpty(),
  check('requester.email', 'Please include a valid email').isEmail()
], ticketController.createTicket);

// @route   PUT api/tickets/:id
// @desc    Update a ticket
// @access  Private
router.put('/:id', auth, ticketController.updateTicket);

// @route   DELETE api/tickets/:id
// @desc    Delete a ticket
// @access  Private (admin only)
router.delete('/:id', auth, ticketController.deleteTicket);

// @route   POST api/tickets/:id/comments
// @desc    Add a comment to a ticket
// @access  Private
router.post('/:id/comments', [
  auth,
  check('text', 'Comment text is required').not().isEmpty()
], ticketController.addComment);

// @route   POST api/tickets/:id/status
// @desc    Update ticket status
// @access  Private
router.post('/:id/status', [
  auth,
  check('status', 'Status is required').isIn(['open', 'in_progress', 'on_hold', 'resolved', 'closed'])
], ticketController.updateStatus);

// @route   POST api/tickets/:id/assign
// @desc    Assign ticket to a user
// @access  Private
router.post('/:id/assign', [
  auth,
  check('userId', 'User ID is required').not().isEmpty()
], ticketController.assignTicket);

// @route   GET api/tickets/status/:status
// @desc    Get tickets by status
// @access  Private
router.get('/status/:status', auth, ticketController.getTicketsByStatus);

// @route   GET api/tickets/priority/:priority
// @desc    Get tickets by priority
// @access  Private
router.get('/priority/:priority', auth, ticketController.getTicketsByPriority);

// @route   GET api/tickets/assignee/:userId
// @desc    Get tickets assigned to a user
// @access  Private
router.get('/assignee/:userId', auth, ticketController.getTicketsByAssignee);

// @route   GET api/tickets/sla/breached
// @desc    Get tickets with breached SLA
// @access  Private
router.get('/sla/breached', auth, ticketController.getBreachedSLATickets);

// @route   GET api/tickets/generate-number
// @desc    Generate a new ticket number
// @access  Private
router.get('/generate-number', auth, ticketController.generateTicketNumber);

module.exports = router;
