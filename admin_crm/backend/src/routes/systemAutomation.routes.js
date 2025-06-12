const express = require('express');
const router = express.Router();

// Import controllers
const systemAutomationController = require('../controllers/systemAutomation.controller');

// Import middleware
const auth = require('../middleware/auth');

// @route   POST api/system/validate
// @desc    Run full system validation
// @access  Private (admin only)
router.post('/validate', auth, systemAutomationController.runFullSystemValidation);

// @route   POST api/system/automation
// @desc    Run all system automation
// @access  Private (admin only)
router.post('/automation', auth, systemAutomationController.runAllAutomation);

// @route   GET api/system/validation-status
// @desc    Get latest validation status
// @access  Private (admin only)
router.get('/validation-status', auth, systemAutomationController.getValidationStatus);

// @route   GET api/system/compliance
// @desc    Get compliance status
// @access  Private (admin only)
router.get('/compliance', auth, systemAutomationController.getComplianceStatus);

module.exports = router;
