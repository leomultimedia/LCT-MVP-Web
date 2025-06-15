const SocialMediaAccount = require('../models/SocialMediaAccount');
const { validationResult } = require('express-validator');

// Controller methods for social media account management
const socialMediaAccountController = {
  // Get all social media accounts
  getAccounts: async (req, res) => {
    try {
      const accounts = await SocialMediaAccount.find().sort({ platform: 1, name: 1 });
      res.json(accounts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get social media account by ID
  getAccountById: async (req, res) => {
    try {
      const account = await SocialMediaAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new social media account
  createAccount: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        platform, 
        name, 
        handle, 
        url, 
        description, 
        credentials 
      } = req.body;
      
      // Create new account
      const account = new SocialMediaAccount({
        platform,
        name,
        handle,
        url,
        description,
        credentials: credentials || {},
        connectionStatus: 'disconnected',
        isActive: true,
        createdBy: req.user.id
      });
      
      await account.save();
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a social media account
  updateAccount: async (req, res) => {
    try {
      const { 
        platform, 
        name, 
        handle, 
        url, 
        description, 
        credentials,
        isActive 
      } = req.body;
      
      // Find account by ID
      let account = await SocialMediaAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      
      // Update fields
      if (platform) account.platform = platform;
      if (name) account.name = name;
      if (handle) account.handle = handle;
      if (url) account.url = url;
      if (description !== undefined) account.description = description;
      if (credentials) {
        account.credentials = {
          ...account.credentials,
          ...credentials
        };
      }
      if (isActive !== undefined) account.isActive = isActive;
      
      account.updatedAt = Date.now();
      
      await account.save();
      
      res.json(account);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a social media account
  deleteAccount: async (req, res) => {
    try {
      const account = await SocialMediaAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      
      // Instead of deleting, mark as inactive
      account.isActive = false;
      account.updatedAt = Date.now();
      
      await account.save();
      
      res.json({ msg: 'Social media account deactivated' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Check connection status of a social media account
  checkConnection: async (req, res) => {
    try {
      const account = await SocialMediaAccount.findById(req.params.id);
      
      if (!account) {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      
      // Check connection
      const isConnected = await account.checkConnection();
      
      res.json({
        success: true,
        connectionStatus: account.connectionStatus,
        isConnected
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get social media accounts by platform
  getAccountsByPlatform: async (req, res) => {
    try {
      const accounts = await SocialMediaAccount.findByPlatform(req.params.platform);
      res.json(accounts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get all connected social media accounts
  getConnectedAccounts: async (req, res) => {
    try {
      const accounts = await SocialMediaAccount.findConnectedAccounts();
      res.json(accounts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = socialMediaAccountController;
