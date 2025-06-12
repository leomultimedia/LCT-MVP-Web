const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const contentTemplateController = require('../controllers/contentTemplate.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/social/templates
// @desc    Get all content templates
// @access  Private
router.get('/templates', auth, contentTemplateController.getTemplates);

// @route   GET api/social/templates/:id
// @desc    Get content template by ID
// @access  Private
router.get('/templates/:id', auth, contentTemplateController.getTemplateById);

// @route   POST api/social/templates
// @desc    Create a new content template
// @access  Private
router.post('/templates', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('contentStructure.textTemplate', 'Text template is required').not().isEmpty()
  ]
], contentTemplateController.createTemplate);

// @route   PUT api/social/templates/:id
// @desc    Update a content template
// @access  Private
router.put('/templates/:id', auth, contentTemplateController.updateTemplate);

// @route   DELETE api/social/templates/:id
// @desc    Delete a content template
// @access  Private
router.delete('/templates/:id', auth, contentTemplateController.deleteTemplate);

// @route   POST api/social/templates/:id/generate
// @desc    Generate content from template
// @access  Private
router.post('/templates/:id/generate', auth, contentTemplateController.generateContent);

// @route   GET api/social/templates/category/:category
// @desc    Get templates by category
// @access  Private
router.get('/templates/category/:category', auth, contentTemplateController.getTemplatesByCategory);

// @route   GET api/social/templates/platform/:platform
// @desc    Get templates by platform
// @access  Private
router.get('/templates/platform/:platform', auth, contentTemplateController.getTemplatesByPlatform);

// @route   GET api/social/templates/tags
// @desc    Get templates by tags
// @access  Private
router.get('/templates/tags', [
  auth,
  check('tags', 'Tags are required').isArray({ min: 1 })
], contentTemplateController.getTemplatesByTags);

module.exports = router;
