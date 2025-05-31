const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const pipelineController = require('../controllers/pipeline.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/pipeline
// @desc    Get all pipeline stages
// @access  Private
router.get('/', auth, pipelineController.getPipelineStages);

// @route   GET api/pipeline/:id
// @desc    Get pipeline stage by ID
// @access  Private
router.get('/:id', auth, pipelineController.getPipelineStageById);

// @route   POST api/pipeline
// @desc    Create a new pipeline stage
// @access  Private
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('order', 'Order is required').isNumeric()
  ]
], pipelineController.createPipelineStage);

// @route   PUT api/pipeline/:id
// @desc    Update a pipeline stage
// @access  Private
router.put('/:id', auth, pipelineController.updatePipelineStage);

// @route   DELETE api/pipeline/:id
// @desc    Delete a pipeline stage
// @access  Private
router.delete('/:id', auth, pipelineController.deletePipelineStage);

// @route   GET api/pipeline/:id/leads
// @desc    Get leads in a pipeline stage
// @access  Private
router.get('/:id/leads', auth, pipelineController.getLeadsInStage);

// @route   GET api/pipeline/:id/conversion
// @desc    Get conversion rate for a pipeline stage
// @access  Private
router.get('/:id/conversion', auth, pipelineController.getStageConversionRate);

// @route   POST api/pipeline/:id/automation
// @desc    Add automation rule to pipeline stage
// @access  Private
router.post('/:id/automation', [
  auth,
  [
    check('condition', 'Condition is required').not().isEmpty(),
    check('value', 'Value is required').not().isEmpty(),
    check('action', 'Action is required').not().isEmpty(),
    check('actionValue', 'Action value is required').not().isEmpty()
  ]
], pipelineController.addAutomationRule);

// @route   DELETE api/pipeline/:id/automation/:ruleId
// @desc    Delete automation rule from pipeline stage
// @access  Private
router.delete('/:id/automation/:ruleId', auth, pipelineController.deleteAutomationRule);

module.exports = router;
