const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controllers
const dashboardController = require('../controllers/dashboard.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   GET api/dashboards
// @desc    Get all dashboards
// @access  Private
router.get('/', auth, dashboardController.getDashboards);

// @route   GET api/dashboards/:id
// @desc    Get dashboard by ID
// @access  Private
router.get('/:id', auth, dashboardController.getDashboardById);

// @route   POST api/dashboards
// @desc    Create a new dashboard
// @access  Private
router.post('/', [
  auth,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty()
  ]
], dashboardController.createDashboard);

// @route   PUT api/dashboards/:id
// @desc    Update a dashboard
// @access  Private
router.put('/:id', auth, dashboardController.updateDashboard);

// @route   DELETE api/dashboards/:id
// @desc    Delete a dashboard
// @access  Private
router.delete('/:id', auth, dashboardController.deleteDashboard);

// @route   POST api/dashboards/:id/widgets
// @desc    Add a widget to a dashboard
// @access  Private
router.post('/:id/widgets', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
    check('dataSource', 'Data source is required').not().isEmpty(),
    check('position', 'Position is required').not().isEmpty()
  ]
], dashboardController.addWidget);

// @route   PUT api/dashboards/:id/widgets/:widgetId
// @desc    Update a widget in a dashboard
// @access  Private
router.put('/:id/widgets/:widgetId', auth, dashboardController.updateWidget);

// @route   DELETE api/dashboards/:id/widgets/:widgetId
// @desc    Remove a widget from a dashboard
// @access  Private
router.delete('/:id/widgets/:widgetId', auth, dashboardController.removeWidget);

// @route   GET api/dashboards/type/:type
// @desc    Get dashboards by type
// @access  Private
router.get('/type/:type', auth, dashboardController.getDashboardsByType);

// @route   GET api/dashboards/default
// @desc    Get default dashboard
// @access  Private
router.get('/default', auth, dashboardController.getDefaultDashboard);

// @route   POST api/dashboards/:id/default
// @desc    Set a dashboard as default
// @access  Private
router.post('/:id/default', auth, dashboardController.setDefaultDashboard);

// @route   POST api/dashboards/:id/share
// @desc    Share a dashboard with users
// @access  Private
router.post('/:id/share', [
  auth,
  [
    check('users', 'Users are required').isArray({ min: 1 }),
    check('permission', 'Permission is required').isIn(['view', 'edit'])
  ]
], dashboardController.shareDashboard);

module.exports = router;
