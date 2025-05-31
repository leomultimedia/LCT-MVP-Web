const EmailTemplate = require('../models/EmailTemplate');
const Lead = require('../models/Lead');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

// Controller methods for email template management
const emailTemplateController = {
  // Get all email templates
  getEmailTemplates: async (req, res) => {
    try {
      const templates = await EmailTemplate.find().sort({ createdAt: -1 });
      res.json(templates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get email template by ID
  getEmailTemplateById: async (req, res) => {
    try {
      const template = await EmailTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      
      res.json(template);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new email template
  createEmailTemplate: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        name, 
        subject, 
        body, 
        campaignId, 
        sequenceOrder, 
        triggerCondition, 
        triggerValue, 
        tags 
      } = req.body;
      
      // Create new email template
      const template = new EmailTemplate({
        name,
        subject,
        body,
        campaignId,
        sequenceOrder,
        triggerCondition,
        triggerValue,
        tags,
        createdBy: req.user.id
      });
      
      await template.save();
      
      res.json(template);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update an email template
  updateEmailTemplate: async (req, res) => {
    try {
      const { 
        name, 
        subject, 
        body, 
        campaignId, 
        sequenceOrder, 
        triggerCondition, 
        triggerValue, 
        isActive, 
        tags 
      } = req.body;
      
      // Find template by ID
      let template = await EmailTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      
      // Update fields
      if (name) template.name = name;
      if (subject) template.subject = subject;
      if (body) template.body = body;
      if (campaignId) template.campaignId = campaignId;
      if (sequenceOrder !== undefined) template.sequenceOrder = sequenceOrder;
      if (triggerCondition) template.triggerCondition = triggerCondition;
      if (triggerValue !== undefined) template.triggerValue = triggerValue;
      if (isActive !== undefined) template.isActive = isActive;
      if (tags) template.tags = tags;
      
      template.updatedAt = Date.now();
      
      await template.save();
      
      res.json(template);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete an email template
  deleteEmailTemplate: async (req, res) => {
    try {
      const template = await EmailTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      
      await template.remove();
      
      res.json({ msg: 'Email template removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get email templates for a campaign
  getTemplatesByCampaign: async (req, res) => {
    try {
      const templates = await EmailTemplate.find({ 
        campaignId: req.params.campaignId,
        isActive: true
      }).sort({ sequenceOrder: 1 });
      
      res.json(templates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Render email template with lead data
  renderTemplateForLead: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { leadId } = req.body;
      
      const template = await EmailTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      const renderedEmail = template.renderForLead(lead);
      
      res.json(renderedEmail);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Template or lead not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Send email template to lead
  sendEmailToLead: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { leadId } = req.body;
      
      const template = await EmailTemplate.findById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ msg: 'Email template not found' });
      }
      
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        return res.status(404).json({ msg: 'Lead not found' });
      }
      
      const { subject, body } = template.renderForLead(lead);
      
      // For zero-cost implementation, we'll use a mock email service
      // In production, this would connect to a real email service
      const mockTransporter = {
        sendMail: (mailOptions) => {
          console.log('Email would be sent with:', mailOptions);
          return Promise.resolve({ messageId: 'mock-id-' + Date.now() });
        }
      };
      
      // Send email
      const info = await mockTransporter.sendMail({
        from: '"Lear Cyber Tech" <noreply@learcybertech.com>',
        to: lead.email,
        subject,
        html: body
      });
      
      // Add activity to lead
      lead.activities.unshift({
        type: 'email',
        description: `Email sent: ${subject}`,
        date: Date.now(),
        completed: true
      });
      
      // Update last activity timestamp
      lead.lastActivity = Date.now();
      
      await lead.save();
      
      res.json({ 
        success: true, 
        messageId: info.messageId,
        lead: lead
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Template or lead not found' });
      }
      res.status(500).send('Server Error');
    }
  }
};

module.exports = emailTemplateController;
