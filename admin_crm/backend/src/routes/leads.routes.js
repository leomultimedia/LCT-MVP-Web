const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const leadsController = require('../controllers/leads.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/leads
// @desc    Get all leads
// @access  Private
router.get('/', auth, leadsController.getLeads);

// @route   GET api/leads/:id
// @desc    Get lead by ID
// @access  Private
router.get('/:id', auth, leadsController.getLeadById);

// @route   POST api/leads
// @desc    Create a new lead
// @access  Private
router.post('/', [
  auth,
  [
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is required').not().isEmpty()
  ]
], leadsController.createLead);

// @route   PUT api/leads/:id
// @desc    Update a lead
// @access  Private
router.put('/:id', auth, leadsController.updateLead);

// @route   DELETE api/leads/:id
// @desc    Delete a lead
// @access  Private
router.delete('/:id', auth, leadsController.deleteLead);

// @route   POST api/leads/:id/activities
// @desc    Add activity to lead
// @access  Private
router.post('/:id/activities', [
  auth,
  [
    check('type', 'Activity type is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ]
], leadsController.addActivity);

// @route   GET api/leads/follow-up
// @desc    Get leads needing follow-up
// @access  Private
router.get('/follow-up', auth, leadsController.getLeadsNeedingFollowUp);

// @route   POST api/leads/:id/score
// @desc    Recalculate lead score
// @access  Private
router.post('/:id/score', auth, leadsController.recalculateScore);

// @route   PUT api/leads/:id/stage
// @desc    Move lead to different pipeline stage
// @access  Private
router.put('/:id/stage', [
  auth,
  [
    check('stageId', 'Stage ID is required').not().isEmpty()
  ]
], leadsController.moveToStage);

module.exports = router;
