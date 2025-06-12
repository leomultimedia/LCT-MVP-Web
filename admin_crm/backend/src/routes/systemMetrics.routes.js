const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const systemMetricController = require('../controllers/systemMetric.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/monitoring/metrics
// @desc    Get all system metrics
// @access  Private
router.get('/metrics', auth, systemMetricController.getMetrics);

// @route   GET api/monitoring/metrics/latest
// @desc    Get latest system metrics
// @access  Private
router.get('/metrics/latest', auth, systemMetricController.getLatestMetrics);

// @route   GET api/monitoring/metrics/type/:metricType/module/:module
// @desc    Get metrics by type and module
// @access  Private
router.get('/metrics/type/:metricType/module/:module', auth, systemMetricController.getMetricsByTypeAndModule);

// @route   POST api/monitoring/metrics/timerange
// @desc    Get metrics by time range
// @access  Private
router.post('/metrics/timerange', [
  auth,
  [
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty()
  ]
], systemMetricController.getMetricsByTimeRange);

// @route   POST api/monitoring/metrics
// @desc    Record a new system metric
// @access  Private
router.post('/metrics', [
  auth,
  [
    check('metricType', 'Metric type is required').not().isEmpty(),
    check('module', 'Module is required').not().isEmpty(),
    check('name', 'Name is required').not().isEmpty(),
    check('value', 'Value is required').not().isEmpty()
  ]
], systemMetricController.recordMetric);

// @route   GET api/monitoring/metrics/errors
// @desc    Get error logs
// @access  Private
router.get('/metrics/errors', auth, systemMetricController.getErrorLogs);

// @route   GET api/monitoring/metrics/security
// @desc    Get security events
// @access  Private
router.get('/metrics/security', auth, systemMetricController.getSecurityEvents);

// @route   GET api/monitoring/health
// @desc    Get system health status
// @access  Private
router.get('/health', auth, systemMetricController.getSystemHealth);

// @route   GET api/monitoring/summary
// @desc    Get system-wide summary
// @access  Private
router.get('/summary', auth, systemMetricController.getSystemSummary);

module.exports = router;
