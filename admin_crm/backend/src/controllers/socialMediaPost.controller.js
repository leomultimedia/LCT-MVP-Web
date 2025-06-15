const SocialMediaPost = require('../models/SocialMediaPost');
const SocialMediaAccount = require('../models/SocialMediaAccount');
const { validationResult } = require('express-validator');

// Controller methods for social media post management
const socialMediaPostController = {
  // Get all social media posts
  getPosts: async (req, res) => {
    try {
      const posts = await SocialMediaPost.find()
        .populate('account', 'name platform handle')
        .sort({ createdAt: -1 });
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get social media post by ID
  getPostById: async (req, res) => {
    try {
      const post = await SocialMediaPost.findById(req.params.id)
        .populate('account', 'name platform handle');
      
      if (!post) {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      
      res.json(post);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new social media post
  createPost: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        account, 
        content, 
        aiGenerated, 
        aiPrompt, 
        tags, 
        campaign 
      } = req.body;
      
      // Verify account exists
      const accountExists = await SocialMediaAccount.findById(account);
      if (!accountExists) {
        return res.status(404).json({ msg: 'Social media account not found' });
      }
      
      // Create new post
      const post = new SocialMediaPost({
        account,
        content,
        aiGenerated: aiGenerated || false,
        aiPrompt,
        status: 'draft',
        tags: tags || [],
        campaign,
        createdBy: req.user.id
      });
      
      await post.save();
      
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a social media post
  updatePost: async (req, res) => {
    try {
      const { 
        content, 
        aiGenerated, 
        aiPrompt, 
        tags, 
        campaign 
      } = req.body;
      
      // Find post by ID
      let post = await SocialMediaPost.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      
      // Check if post can be updated
      if (['published', 'archived'].includes(post.status)) {
        return res.status(400).json({ msg: `Cannot update post in ${post.status} status` });
      }
      
      // Update fields
      if (content) post.content = content;
      if (aiGenerated !== undefined) post.aiGenerated = aiGenerated;
      if (aiPrompt) post.aiPrompt = aiPrompt;
      if (tags) post.tags = tags;
      if (campaign) post.campaign = campaign;
      
      post.updatedAt = Date.now();
      
      await post.save();
      
      res.json(post);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a social media post
  deletePost: async (req, res) => {
    try {
      const post = await SocialMediaPost.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      
      // Check if post can be deleted
      if (post.status === 'published') {
        return res.status(400).json({ msg: 'Cannot delete a published post' });
      }
      
      await post.remove();
      
      res.json({ msg: 'Social media post removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Publish a social media post
  publishPost: async (req, res) => {
    try {
      const post = await SocialMediaPost.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      
      // Check if post can be published
      if (!['draft', 'scheduled', 'failed'].includes(post.status)) {
        return res.status(400).json({ msg: `Cannot publish post in ${post.status} status` });
      }
      
      // Publish post
      const success = await post.publish();
      
      if (!success) {
        return res.status(500).json({ 
          msg: 'Failed to publish post', 
          error: post.errorDetails 
        });
      }
      
      res.json(post);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Schedule a social media post
  schedulePost: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { scheduledTime } = req.body;
      
      const post = await SocialMediaPost.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      
      // Check if post can be scheduled
      if (!['draft', 'failed'].includes(post.status)) {
        return res.status(400).json({ msg: `Cannot schedule post in ${post.status} status` });
      }
      
      // Schedule post
      post.status = 'scheduled';
      post.scheduledTime = new Date(scheduledTime);
      post.updatedAt = Date.now();
      
      await post.save();
      
      res.json(post);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Update analytics for a social media post
  updatePostAnalytics: async (req, res) => {
    try {
      const post = await SocialMediaPost.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      
      // Check if post is published
      if (post.status !== 'published') {
        return res.status(400).json({ msg: 'Can only update analytics for published posts' });
      }
      
      // Update analytics
      const success = await post.updateAnalytics();
      
      if (!success) {
        return res.status(500).json({ msg: 'Failed to update analytics' });
      }
      
      res.json({
        success: true,
        analytics: post.analytics
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Social media post not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get posts by social media account
  getPostsByAccount: async (req, res) => {
    try {
      const posts = await SocialMediaPost.findByAccount(req.params.accountId);
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get posts by status
  getPostsByStatus: async (req, res) => {
    try {
      const posts = await SocialMediaPost.findByStatus(req.params.status);
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get posts by campaign
  getPostsByCampaign: async (req, res) => {
    try {
      const posts = await SocialMediaPost.findByCampaign(req.params.campaignId);
      res.json(posts);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Generate post content using AI
  generateAIContent: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { prompt, platform } = req.body;
      
      // In a real implementation, this would call an AI service like OpenAI
      // For zero-cost implementation, we'll simulate AI content generation
      
      // Generate content based on platform
      let generatedContent = '';
      
      switch (platform) {
        case 'twitter':
          generatedContent = `${prompt.substring(0, 20)}... Check out our latest update! #LearCyberTech #Cybersecurity`;
          break;
        case 'facebook':
        case 'linkedin':
          generatedContent = `${prompt.substring(0, 30)}...\n\nAt Lear Cyber Tech, we're committed to providing cutting-edge cybersecurity solutions. Our team of experts is dedicated to protecting your digital assets and ensuring your peace of mind.\n\n#LearCyberTech #Cybersecurity`;
          break;
        case 'instagram':
          generatedContent = `${prompt.substring(0, 25)}... 📱 Swipe to learn more about our cybersecurity solutions!\n\n#LearCyberTech #Cybersecurity #InfoSec #DigitalProtection`;
          break;
        default:
          generatedContent = `${prompt.substring(0, 40)}...\n\nLear Cyber Tech provides innovative cybersecurity solutions for businesses of all sizes. Contact us today to learn how we can protect your digital assets.\n\n#LearCyberTech #Cybersecurity`;
      }
      
      res.json({
        success: true,
        content: {
          text: generatedContent,
          aiGenerated: true,
          aiPrompt: prompt
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = socialMediaPostController;
