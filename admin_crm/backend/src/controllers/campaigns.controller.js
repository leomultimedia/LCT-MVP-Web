const Campaign = require('../models/Campaign');
const { validationResult } = require('express-validator');

// Controller methods for campaign management
const campaignsController = {
  // Get all campaigns
  getCampaigns: async (req, res) => {
    try {
      const campaigns = await Campaign.find().sort({ createdAt: -1 });
      res.json(campaigns);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get campaign by ID
  getCampaignById: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      res.json(campaign);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new campaign
  createCampaign: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        name, 
        description, 
        type, 
        targetAudience, 
        startDate, 
        endDate, 
        budget, 
        goals, 
        tags 
      } = req.body;
      
      // Create new campaign
      const campaign = new Campaign({
        name,
        description,
        type,
        targetAudience,
        startDate,
        endDate,
        budget,
        goals,
        tags,
        createdBy: req.user.id
      });
      
      await campaign.save();
      
      res.json(campaign);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a campaign
  updateCampaign: async (req, res) => {
    try {
      const { 
        name, 
        description, 
        status, 
        type, 
        targetAudience, 
        startDate, 
        endDate, 
        budget, 
        goals, 
        performanceMetrics, 
        tags 
      } = req.body;
      
      // Find campaign by ID
      let campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      // Update fields
      if (name) campaign.name = name;
      if (description) campaign.description = description;
      if (status) campaign.status = status;
      if (type) campaign.type = type;
      if (targetAudience) campaign.targetAudience = targetAudience;
      if (startDate) campaign.startDate = startDate;
      if (endDate) campaign.endDate = endDate;
      if (budget) campaign.budget = budget;
      if (goals) campaign.goals = goals;
      if (performanceMetrics) campaign.performanceMetrics = performanceMetrics;
      if (tags) campaign.tags = tags;
      
      campaign.updatedAt = Date.now();
      
      await campaign.save();
      
      res.json(campaign);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a campaign
  deleteCampaign: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      await campaign.remove();
      
      res.json({ msg: 'Campaign removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get campaign effectiveness metrics
  getCampaignEffectiveness: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      const effectiveness = campaign.calculateEffectiveness();
      
      res.json(effectiveness);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get campaigns needing attention
  getCampaignsNeedingAttention: async (req, res) => {
    try {
      const campaigns = await Campaign.findNeedingAttention();
      res.json(campaigns);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Start a campaign
  startCampaign: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      if (campaign.status === 'active') {
        return res.status(400).json({ msg: 'Campaign is already active' });
      }
      
      campaign.status = 'active';
      campaign.startDate = campaign.startDate || Date.now();
      campaign.updatedAt = Date.now();
      
      await campaign.save();
      
      res.json(campaign);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Pause a campaign
  pauseCampaign: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      if (campaign.status !== 'active') {
        return res.status(400).json({ msg: 'Campaign is not active' });
      }
      
      campaign.status = 'paused';
      campaign.updatedAt = Date.now();
      
      await campaign.save();
      
      res.json(campaign);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Complete a campaign
  completeCampaign: async (req, res) => {
    try {
      const campaign = await Campaign.findById(req.params.id);
      
      if (!campaign) {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      
      if (campaign.status === 'completed') {
        return res.status(400).json({ msg: 'Campaign is already completed' });
      }
      
      campaign.status = 'completed';
      campaign.endDate = campaign.endDate || Date.now();
      campaign.updatedAt = Date.now();
      
      await campaign.save();
      
      res.json(campaign);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Campaign not found' });
      }
      res.status(500).send('Server Error');
    }
  }
};

module.exports = campaignsController;
