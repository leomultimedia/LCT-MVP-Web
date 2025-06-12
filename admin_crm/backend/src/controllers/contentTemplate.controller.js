const ContentTemplate = require('../models/ContentTemplate');
const { validationResult } = require('express-validator');

// Controller methods for content template management
const contentTemplateController = {
  // Get all content templates
  getTemplates: async (req, res) => {
    try {
      const templates = await ContentTemplate.find({ isActive: true }).sort({ category: 1, name: 1 });
      res.json(templates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get content template by ID
  getTemplateById: async (req, res) => {
    try {
      const template = await ContentTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      
      res.json(template);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new content template
  createTemplate: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        name, 
        description, 
        category, 
        platform, 
        contentStructure, 
        aiPromptTemplate, 
        tags 
      } = req.body;
      
      // Create new template
      const template = new ContentTemplate({
        name,
        description,
        category: category || 'other',
        platform: platform || 'all',
        contentStructure,
        aiPromptTemplate,
        tags: tags || [],
        isActive: true,
        createdBy: req.user.id
      });
      
      await template.save();
      
      res.json(template);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a content template
  updateTemplate: async (req, res) => {
    try {
      const { 
        name, 
        description, 
        category, 
        platform, 
        contentStructure, 
        aiPromptTemplate, 
        tags,
        isActive 
      } = req.body;
      
      // Find template by ID
      let template = await ContentTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      
      // Update fields
      if (name) template.name = name;
      if (description !== undefined) template.description = description;
      if (category) template.category = category;
      if (platform) template.platform = platform;
      if (contentStructure) template.contentStructure = contentStructure;
      if (aiPromptTemplate !== undefined) template.aiPromptTemplate = aiPromptTemplate;
      if (tags) template.tags = tags;
      if (isActive !== undefined) template.isActive = isActive;
      
      template.updatedAt = Date.now();
      
      await template.save();
      
      res.json(template);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a content template
  deleteTemplate: async (req, res) => {
    try {
      const template = await ContentTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      
      // Instead of deleting, mark as inactive
      template.isActive = false;
      template.updatedAt = Date.now();
      
      await template.save();
      
      res.json({ msg: 'Content template deactivated' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Generate content from template
  generateContent: async (req, res) => {
    try {
      const template = await ContentTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      
      const variables = req.body.variables || {};
      
      // Generate content
      const content = template.generateContent(variables);
      
      if (!content) {
        return res.status(500).json({ msg: 'Failed to generate content' });
      }
      
      // Generate AI prompt if available
      const aiPrompt = template.generateAIPrompt(variables);
      
      res.json({
        success: true,
        content,
        aiPrompt
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Content template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get templates by category
  getTemplatesByCategory: async (req, res) => {
    try {
      const templates = await ContentTemplate.findByCategory(req.params.category);
      res.json(templates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get templates by platform
  getTemplatesByPlatform: async (req, res) => {
    try {
      const templates = await ContentTemplate.findByPlatform(req.params.platform);
      res.json(templates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get templates by tags
  getTemplatesByTags: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { tags } = req.body;
      
      const templates = await ContentTemplate.findByTags(tags);
      res.json(templates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = contentTemplateController;
