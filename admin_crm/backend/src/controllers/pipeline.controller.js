const PipelineStage = require('../models/PipelineStage');
const Lead = require('../models/Lead');
const { validationResult } = require('express-validator');

// Controller methods for pipeline stage management
const pipelineController = {
  // Get all pipeline stages
  getPipelineStages: async (req, res) => {
    try {
      const stages = await PipelineStage.getOrderedStages();
      res.json(stages);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get pipeline stage by ID
  getPipelineStageById: async (req, res) => {
    try {
      const stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      res.json(stage);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new pipeline stage
  createPipelineStage: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, order, conversionGoal, color } = req.body;
      
      // Create new pipeline stage
      const stage = new PipelineStage({
        name,
        description,
        order,
        conversionGoal,
        color
      });
      
      await stage.save();
      
      res.json(stage);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a pipeline stage
  updatePipelineStage: async (req, res) => {
    try {
      const { name, description, order, conversionGoal, color, isActive } = req.body;
      
      // Find stage by ID
      let stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      // Update fields
      if (name) stage.name = name;
      if (description) stage.description = description;
      if (order !== undefined) stage.order = order;
      if (conversionGoal !== undefined) stage.conversionGoal = conversionGoal;
      if (color) stage.color = color;
      if (isActive !== undefined) stage.isActive = isActive;
      
      stage.updatedAt = Date.now();
      
      await stage.save();
      
      res.json(stage);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a pipeline stage
  deletePipelineStage: async (req, res) => {
    try {
      const stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      // Check if there are leads in this stage
      const leadsInStage = await Lead.countDocuments({ stageId: stage._id });
      
      if (leadsInStage > 0) {
        return res.status(400).json({ 
          msg: 'Cannot delete stage with leads. Move leads to another stage first.' 
        });
      }
      
      await stage.remove();
      
      res.json({ msg: 'Pipeline stage removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get leads in a pipeline stage
  getLeadsInStage: async (req, res) => {
    try {
      const stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      const leads = await stage.getLeads();
      
      res.json(leads);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get conversion rate for a pipeline stage
  getStageConversionRate: async (req, res) => {
    try {
      const stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      const conversionRate = await stage.calculateConversionRate();
      
      res.json({ conversionRate });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Add automation rule to pipeline stage
  addAutomationRule: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { condition, value, action, actionValue } = req.body;
      
      const stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      // Add new automation rule
      stage.automationRules.push({
        condition,
        value,
        action,
        actionValue,
        isActive: true
      });
      
      stage.updatedAt = Date.now();
      
      await stage.save();
      
      res.json(stage);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete automation rule from pipeline stage
  deleteAutomationRule: async (req, res) => {
    try {
      const stage = await PipelineStage.findById(req.params.id);
      
      if (!stage) {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      
      // Find rule index
      const ruleIndex = stage.automationRules.findIndex(
        rule => rule._id.toString() === req.params.ruleId
      );
      
      if (ruleIndex === -1) {
        return res.status(404).json({ msg: 'Automation rule not found' });
      }
      
      // Remove rule
      stage.automationRules.splice(ruleIndex, 1);
      
      stage.updatedAt = Date.now();
      
      await stage.save();
      
      res.json(stage);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Pipeline stage not found' });
      }
      res.status(500).send('Server Error');
    }
  }
};

module.exports = pipelineController;
