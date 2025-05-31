const Lead = require('../models/Lead');
const { validationResult } = require('express-validator');

// Controller methods for lead management
const leadsController = {
  // Get all leads
  getLeads: async (req, res) => {
    try {
      const leads = await Lead.find().sort({ createdAt: -1 });
      res.json(leads);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get lead by ID
  getLeadById: async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      res.json(lead);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new lead
  createLead: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, name, company, phone, source, status, notes, tags, customFields } = req.body;
      
      // Check if lead already exists
      let lead = await Lead.findOne({ email });
      
      if (lead) {
        return res.status(400).json({ msg: 'Lead already exists' });
      }
      
      // Create new lead
      lead = new Lead({
        email,
        name,
        company,
        phone,
        source,
        status,
        notes,
        tags,
        customFields
      });
      
      // Calculate initial score
      lead.score = lead.calculateScore();
      
      await lead.save();
      
      res.json(lead);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a lead
  updateLead: async (req, res) => {
    try {
      const { email, name, company, phone, source, status, notes, tags, customFields } = req.body;
      
      // Find lead by ID
      let lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Update fields
      if (email) lead.email = email;
      if (name) lead.name = name;
      if (company) lead.company = company;
      if (phone) lead.phone = phone;
      if (source) lead.source = source;
      if (status) lead.status = status;
      if (notes) lead.notes = notes;
      if (tags) lead.tags = tags;
      if (customFields) lead.customFields = customFields;
      
      // Recalculate score
      lead.score = lead.calculateScore();
      
      await lead.save();
      
      res.json(lead);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a lead
  deleteLead: async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      await lead.remove();
      
      res.json({ msg: 'Lead removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Add activity to lead
  addActivity: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { type, description, completed } = req.body;
      
      const lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Add new activity
      lead.activities.unshift({
        type,
        description,
        completed: completed || false,
        date: Date.now()
      });
      
      // Update last activity timestamp
      lead.lastActivity = Date.now();
      
      // Recalculate score
      lead.score = lead.calculateScore();
      
      await lead.save();
      
      res.json(lead);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get leads needing follow-up
  getLeadsNeedingFollowUp: async (req, res) => {
    try {
      const leads = await Lead.findNeedingFollowUp();
      res.json(leads);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Recalculate lead score
  recalculateScore: async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      lead.score = lead.calculateScore();
      
      await lead.save();
      
      res.json({ score: lead.score });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Move lead to different pipeline stage
  moveToStage: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { stageId } = req.body;
      
      const lead = await Lead.findById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      // Update stage
      lead.stageId = stageId;
      
      // Add activity for stage change
      lead.activities.unshift({
        type: 'note',
        description: 'Moved to new pipeline stage',
        date: Date.now(),
        completed: true
      });
      
      // Update last activity timestamp
      lead.lastActivity = Date.now();
      
      await lead.save();
      
      res.json(lead);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      res.status(500).send('Server Error');
    }
  }
};

module.exports = leadsController;
