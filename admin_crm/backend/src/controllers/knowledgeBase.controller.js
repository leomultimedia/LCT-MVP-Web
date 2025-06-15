const KnowledgeBase = require('../models/KnowledgeBase');
const { validationResult } = require('express-validator');

// Controller methods for knowledge base management
const knowledgeBaseController = {
  // Get all knowledge base articles
  getArticles: async (req, res) => {
    try {
      // By default, only return published articles for public access
      const status = req.query.status || 'published';
      
      // If admin is requesting, they can see all statuses
      const filter = req.user && req.user.role === 'admin' 
        ? status === 'all' ? {} : { status } 
        : { status: 'published' };
      
      const articles = await KnowledgeBase.find(filter).sort({ createdAt: -1 });
      res.json(articles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get knowledge base article by ID
  getArticleById: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      // If article is not published, only allow admin access
      if (article.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      res.json(article);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new knowledge base article
  createArticle: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        title, 
        content, 
        category, 
        tags, 
        attachments, 
        status 
      } = req.body;
      
      // Create new article
      const article = new KnowledgeBase({
        title,
        content,
        category,
        tags: tags || [],
        attachments: attachments || [],
        status: status || 'draft',
        createdBy: req.user.id,
        updatedBy: req.user.id
      });
      
      await article.save();
      
      res.json(article);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a knowledge base article
  updateArticle: async (req, res) => {
    try {
      const { 
        title, 
        content, 
        category, 
        tags, 
        attachments, 
        status,
        relatedArticles 
      } = req.body;
      
      // Find article by ID
      let article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      // Update fields
      if (title) article.title = title;
      if (content) article.content = content;
      if (category) article.category = category;
      if (tags) article.tags = tags;
      if (attachments) article.attachments = attachments;
      if (status) article.status = status;
      if (relatedArticles) article.relatedArticles = relatedArticles;
      
      article.updatedBy = req.user.id;
      article.updatedAt = Date.now();
      
      await article.save();
      
      res.json(article);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a knowledge base article
  deleteArticle: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      await article.remove();
      
      res.json({ msg: 'Article removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Publish a knowledge base article
  publishArticle: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      article.status = 'published';
      article.updatedBy = req.user.id;
      article.updatedAt = Date.now();
      
      await article.save();
      
      res.json(article);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Archive a knowledge base article
  archiveArticle: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      article.status = 'archived';
      article.updatedBy = req.user.id;
      article.updatedAt = Date.now();
      
      await article.save();
      
      res.json(article);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Increment view count for an article
  incrementViewCount: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      // Only increment view count for published articles
      if (article.status !== 'published') {
        return res.status(400).json({ msg: 'Cannot increment view count for unpublished article' });
      }
      
      await article.incrementViewCount();
      
      res.json({ success: true, viewCount: article.viewCount });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Mark article as helpful
  markAsHelpful: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      // Only allow feedback for published articles
      if (article.status !== 'published') {
        return res.status(400).json({ msg: 'Cannot provide feedback for unpublished article' });
      }
      
      await article.markAsHelpful();
      
      res.json({ success: true, helpfulCount: article.helpfulCount });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Mark article as unhelpful
  markAsUnhelpful: async (req, res) => {
    try {
      const article = await KnowledgeBase.findById(req.params.id);
      
      if (!article) {
        return res.status(404).json({ msg: 'Article not found' });
      }
      
      // Only allow feedback for published articles
      if (article.status !== 'published') {
        return res.status(400).json({ msg: 'Cannot provide feedback for unpublished article' });
      }
      
      await article.markAsUnhelpful();
      
      res.json({ success: true, unhelpfulCount: article.unhelpfulCount });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Article not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get articles by category
  getArticlesByCategory: async (req, res) => {
    try {
      const articles = await KnowledgeBase.findByCategory(req.params.category);
      res.json(articles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Search articles by keyword
  searchArticles: async (req, res) => {
    try {
      const articles = await KnowledgeBase.searchByKeyword(req.params.keyword);
      res.json(articles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get most viewed articles
  getMostViewedArticles: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const articles = await KnowledgeBase.findMostViewed(limit);
      res.json(articles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get most helpful articles
  getMostHelpfulArticles: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const articles = await KnowledgeBase.findMostHelpful(limit);
      res.json(articles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = knowledgeBaseController;
