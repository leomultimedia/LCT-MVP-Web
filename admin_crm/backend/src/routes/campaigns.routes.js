const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const campaignsController = require('../controllers/campaigns.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/campaigns
// @desc    Get all campaigns
// @access  Private
router.get('/', auth, campaignsController.getCampaigns);

// @route   GET api/campaigns/:id
// @desc    Get campaign by ID
// @access  Private
router.get('/:id', auth, campaignsController.getCampaignById);

// @route   POST api/campaigns
// @desc    Create a new campaign
// @access  Private
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty()
  ]
], campaignsController.createCampaign);

// @route   PUT api/campaigns/:id
// @desc    Update a campaign
// @access  Private
router.put('/:id', auth, campaignsController.updateCampaign);

// @route   DELETE api/campaigns/:id
// @desc    Delete a campaign
// @access  Private
router.delete('/:id', auth, campaignsController.deleteCampaign);

// @route   GET api/campaigns/:id/effectiveness
// @desc    Get campaign effectiveness metrics
// @access  Private
router.get('/:id/effectiveness', auth, campaignsController.getCampaignEffectiveness);

// @route   GET api/campaigns/attention
// @desc    Get campaigns needing attention
// @access  Private
router.get('/attention', auth, campaignsController.getCampaignsNeedingAttention);

// @route   POST api/campaigns/:id/start
// @desc    Start a campaign
// @access  Private
router.post('/:id/start', auth, campaignsController.startCampaign);

// @route   POST api/campaigns/:id/pause
// @desc    Pause a campaign
// @access  Private
router.post('/:id/pause', auth, campaignsController.pauseCampaign);

// @route   POST api/campaigns/:id/complete
// @desc    Complete a campaign
// @access  Private
router.post('/:id/complete', auth, campaignsController.completeCampaign);

module.exports = router;
