const SystemMetric = require('../models/SystemMetric');
const systemAutomationService = require('../services/systemAutomation.service');

// Controller methods for system automation
const systemAutomationController = {
  // Run full system validation
  runFullSystemValidation: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user.permissions.system_admin) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
      }
      
      // Run full system validation
      const validationResult = await systemAutomationService.runFullSystemValidation();
      
      // Record validation result as a system metric
      await SystemMetric.recordMetric(
        'system_health',
        'system_wide',
        'validation_result',
        validationResult.success ? 'passed' : 'failed',
        null,
        validationResult
      );
      
      res.json(validationResult);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Run all system automation
  runAllAutomation: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user.permissions.system_admin) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
      }
      
      // Run all system automation
      const automationResult = await systemAutomationService.runAllAutomation();
      
      // Record automation result as a system metric
      await SystemMetric.recordMetric(
        'system_health',
        'system_wide',
        'automation_run',
        automationResult.success ? 'successful' : 'failed',
        null,
        automationResult
      );
      
      res.json(automationResult);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get latest validation status
  getValidationStatus: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user.permissions.system_admin) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
      }
      
      // Get latest validation metric
      const validationMetric = await SystemMetric.findOne({
        metricType: 'system_health',
        module: 'system_wide',
        name: 'validation_result'
      }).sort({ timestamp: -1 });
      
      if (!validationMetric) {
        return res.status(404).json({ msg: 'No validation results found' });
      }
      
      res.json({
        timestamp: validationMetric.timestamp,
        status: validationMetric.value,
        details: validationMetric.metadata
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get compliance status
  getComplianceStatus: async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user.permissions.system_admin) {
        return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
      }
      
      // Run compliance validation
      const complianceResult = await systemAutomationService.validateCompliance();
      
      res.json(complianceResult);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = systemAutomationController;
