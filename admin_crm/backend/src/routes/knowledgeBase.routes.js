const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const knowledgeBaseController = require('../controllers/knowledgeBase.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/knowledge
// @desc    Get all knowledge base articles
// @access  Public
router.get('/', knowledgeBaseController.getArticles);

// @route   GET api/knowledge/:id
// @desc    Get knowledge base article by ID
// @access  Public
router.get('/:id', knowledgeBaseController.getArticleById);

// @route   POST api/knowledge
// @desc    Create a new knowledge base article
// @access  Private
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ]
], knowledgeBaseController.createArticle);

// @route   PUT api/knowledge/:id
// @desc    Update a knowledge base article
// @access  Private
router.put('/:id', auth, knowledgeBaseController.updateArticle);

// @route   DELETE api/knowledge/:id
// @desc    Delete a knowledge base article
// @access  Private
router.delete('/:id', auth, knowledgeBaseController.deleteArticle);

// @route   POST api/knowledge/:id/publish
// @desc    Publish a knowledge base article
// @access  Private
router.post('/:id/publish', auth, knowledgeBaseController.publishArticle);

// @route   POST api/knowledge/:id/archive
// @desc    Archive a knowledge base article
// @access  Private
router.post('/:id/archive', auth, knowledgeBaseController.archiveArticle);

// @route   POST api/knowledge/:id/view
// @desc    Increment view count for an article
// @access  Public
router.post('/:id/view', knowledgeBaseController.incrementViewCount);

// @route   POST api/knowledge/:id/helpful
// @desc    Mark article as helpful
// @access  Public
router.post('/:id/helpful', knowledgeBaseController.markAsHelpful);

// @route   POST api/knowledge/:id/unhelpful
// @desc    Mark article as unhelpful
// @access  Public
router.post('/:id/unhelpful', knowledgeBaseController.markAsUnhelpful);

// @route   GET api/knowledge/category/:category
// @desc    Get articles by category
// @access  Public
router.get('/category/:category', knowledgeBaseController.getArticlesByCategory);

// @route   GET api/knowledge/search/:keyword
// @desc    Search articles by keyword
// @access  Public
router.get('/search/:keyword', knowledgeBaseController.searchArticles);

// @route   GET api/knowledge/most-viewed
// @desc    Get most viewed articles
// @access  Public
router.get('/most-viewed', knowledgeBaseController.getMostViewedArticles);

// @route   GET api/knowledge/most-helpful
// @desc    Get most helpful articles
// @access  Public
router.get('/most-helpful', knowledgeBaseController.getMostHelpfulArticles);

module.exports = router;
