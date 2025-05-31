const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const analyticsController = require('../controllers/analytics.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/analytics/sales/overview
// @desc    Get sales funnel overview metrics
// @access  Private
router.get('/overview', auth, analyticsController.getSalesOverview);

// @route   GET api/analytics/sales/leads
// @desc    Get lead analytics
// @access  Private
router.get('/leads', auth, analyticsController.getLeadAnalytics);

// @route   GET api/analytics/sales/campaigns
// @desc    Get campaign performance analytics
// @access  Private
router.get('/campaigns', auth, analyticsController.getCampaignAnalytics);

// @route   GET api/analytics/sales/pipeline
// @desc    Get pipeline conversion analytics
// @access  Private
router.get('/pipeline', auth, analyticsController.getPipelineAnalytics);

// @route   GET api/analytics/sales/forecast
// @desc    Get sales forecast
// @access  Private
router.get('/forecast', auth, analyticsController.getSalesForecast);

module.exports = router;
