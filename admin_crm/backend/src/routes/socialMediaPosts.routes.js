const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const socialMediaPostController = require('../controllers/socialMediaPost.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/social/posts
// @desc    Get all social media posts
// @access  Private
router.get('/posts', auth, socialMediaPostController.getPosts);

// @route   GET api/social/posts/:id
// @desc    Get social media post by ID
// @access  Private
router.get('/posts/:id', auth, socialMediaPostController.getPostById);

// @route   POST api/social/posts
// @desc    Create a new social media post
// @access  Private
router.post('/posts', [
  auth,
  [
    check('account', 'Account ID is required').not().isEmpty(),
    check('content.text', 'Post content is required').not().isEmpty()
  ]
], socialMediaPostController.createPost);

// @route   PUT api/social/posts/:id
// @desc    Update a social media post
// @access  Private
router.put('/posts/:id', auth, socialMediaPostController.updatePost);

// @route   DELETE api/social/posts/:id
// @desc    Delete a social media post
// @access  Private
router.delete('/posts/:id', auth, socialMediaPostController.deletePost);

// @route   POST api/social/posts/:id/publish
// @desc    Publish a social media post
// @access  Private
router.post('/posts/:id/publish', auth, socialMediaPostController.publishPost);

// @route   POST api/social/posts/:id/schedule
// @desc    Schedule a social media post
// @access  Private
router.post('/posts/:id/schedule', [
  auth,
  check('scheduledTime', 'Scheduled time is required').not().isEmpty()
], socialMediaPostController.schedulePost);

// @route   POST api/social/posts/:id/update-analytics
// @desc    Update analytics for a social media post
// @access  Private
router.post('/posts/:id/update-analytics', auth, socialMediaPostController.updatePostAnalytics);

// @route   GET api/social/posts/account/:accountId
// @desc    Get posts by social media account
// @access  Private
router.get('/posts/account/:accountId', auth, socialMediaPostController.getPostsByAccount);

// @route   GET api/social/posts/status/:status
// @desc    Get posts by status
// @access  Private
router.get('/posts/status/:status', auth, socialMediaPostController.getPostsByStatus);

// @route   GET api/social/posts/campaign/:campaignId
// @desc    Get posts by campaign
// @access  Private
router.get('/posts/campaign/:campaignId', auth, socialMediaPostController.getPostsByCampaign);

// @route   POST api/social/posts/generate-ai
// @desc    Generate post content using AI
// @access  Private
router.post('/posts/generate-ai', [
  auth,
  check('prompt', 'AI prompt is required').not().isEmpty()
], socialMediaPostController.generateAIContent);

module.exports = router;
