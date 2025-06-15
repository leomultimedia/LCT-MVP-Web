const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const emailTemplateController = require('../controllers/emailTemplate.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/email-templates
// @desc    Get all email templates
// @access  Private
router.get('/', auth, emailTemplateController.getEmailTemplates);

// @route   GET api/email-templates/:id
// @desc    Get email template by ID
// @access  Private
router.get('/:id', auth, emailTemplateController.getEmailTemplateById);

// @route   POST api/email-templates
// @desc    Create a new email template
// @access  Private
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('subject', 'Subject is required').not().isEmpty(),
    check('body', 'Body is required').not().isEmpty()
  ]
], emailTemplateController.createEmailTemplate);

// @route   PUT api/email-templates/:id
// @desc    Update an email template
// @access  Private
router.put('/:id', auth, emailTemplateController.updateEmailTemplate);

// @route   DELETE api/email-templates/:id
// @desc    Delete an email template
// @access  Private
router.delete('/:id', auth, emailTemplateController.deleteEmailTemplate);

// @route   GET api/email-templates/campaign/:campaignId
// @desc    Get email templates for a campaign
// @access  Private
router.get('/campaign/:campaignId', auth, emailTemplateController.getTemplatesByCampaign);

// @route   POST api/email-templates/:id/render
// @desc    Render email template with lead data
// @access  Private
router.post('/:id/render', [
  auth,
  [
    check('leadId', 'Lead ID is required').not().isEmpty()
  ]
], emailTemplateController.renderTemplateForLead);

// @route   POST api/email-templates/:id/send
// @desc    Send email template to lead
// @access  Private
router.post('/:id/send', [
  auth,
  [
    check('leadId', 'Lead ID is required').not().isEmpty()
  ]
], emailTemplateController.sendEmailToLead);

module.exports = router;
