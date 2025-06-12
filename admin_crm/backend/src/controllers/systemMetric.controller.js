const SystemMetric = require('../models/SystemMetric');
const { validationResult } = require('express-validator');

// Controller methods for system metrics management
const systemMetricController = {
  // Get all system metrics
  getMetrics: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const metrics = await SystemMetric.find().sort({ timestamp: -1 }).limit(limit);
      res.json(metrics);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get latest system metrics
  getLatestMetrics: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const metrics = await SystemMetric.getLatestMetrics(limit);
      res.json(metrics);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get metrics by type and module
  getMetricsByTypeAndModule: async (req, res) => {
    try {
      const { metricType, module } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      
      const metrics = await SystemMetric.getMetricsByTypeAndModule(metricType, module, limit);
      res.json(metrics);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get metrics by time range
  getMetricsByTimeRange: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { startTime, endTime, metricType, module } = req.body;
      
      const metrics = await SystemMetric.getMetricsByTimeRange(
        new Date(startTime),
        new Date(endTime),
        metricType,
        module
      );
      
      res.json(metrics);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Record a new system metric
  recordMetric: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { metricType, module, name, value, unit, metadata } = req.body;
      
      const metric = await SystemMetric.recordMetric(
        metricType,
        module,
        name,
        value,
        unit,
        metadata
      );
      
      if (!metric) {
        return res.status(500).json({ msg: 'Failed to record metric' });
      }
      
      res.json(metric);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get error logs
  getErrorLogs: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const errors = await SystemMetric.getErrorLogs(limit);
      res.json(errors);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get security events
  getSecurityEvents: async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const events = await SystemMetric.getSecurityEvents(limit);
      res.json(events);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get system health status
  getSystemHealth: async (req, res) => {
    try {
      // Get latest health metrics for each module
      const modules = ['sales_funnel', 'accounting_finance', 'itsm_ticketing', 'social_media', 'system_wide'];
      
      const healthStatus = {};
      
      for (const module of modules) {
        const metrics = await SystemMetric.getMetricsByTypeAndModule('system_health', module, 1);
        
        if (metrics.length > 0) {
          healthStatus[module] = metrics[0].value;
        } else {
          healthStatus[module] = 'unknown';
        }
      }
      
      // Calculate overall health
      const healthValues = Object.values(healthStatus).filter(value => value !== 'unknown');
      const overallHealth = healthValues.length > 0
        ? healthValues.reduce((sum, value) => sum + (value === 'healthy' ? 1 : 0), 0) / healthValues.length >= 0.8
          ? 'healthy'
          : 'degraded'
        : 'unknown';
      
      res.json({
        timestamp: new Date(),
        overall: overallHealth,
        modules: healthStatus
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get system-wide summary
  getSystemSummary: async (req, res) => {
    try {
      // Get counts from various modules
      const salesFunnelMetrics = await SystemMetric.getMetricsByTypeAndModule('module_performance', 'sales_funnel', 10);
      const financeMetrics = await SystemMetric.getMetricsByTypeAndModule('module_performance', 'accounting_finance', 10);
      const itsmMetrics = await SystemMetric.getMetricsByTypeAndModule('module_performance', 'itsm_ticketing', 10);
      const socialMediaMetrics = await SystemMetric.getMetricsByTypeAndModule('module_performance', 'social_media', 10);
      
      // Get latest error logs
      const errors = await SystemMetric.getErrorLogs(5);
      
      // Get latest security events
      const securityEvents = await SystemMetric.getSecurityEvents(5);
      
      // Compile summary
      const summary = {
        timestamp: new Date(),
        modules: {
          sales_funnel: salesFunnelMetrics.reduce((obj, metric) => {
            obj[metric.name] = metric.value;
            return obj;
          }, {}),
          accounting_finance: financeMetrics.reduce((obj, metric) => {
            obj[metric.name] = metric.value;
            return obj;
          }, {}),
          itsm_ticketing: itsmMetrics.reduce((obj, metric) => {
            obj[metric.name] = metric.value;
            return obj;
          }, {}),
          social_media: socialMediaMetrics.reduce((obj, metric) => {
            obj[metric.name] = metric.value;
            return obj;
          }, {})
        },
        recent_errors: errors,
        recent_security_events: securityEvents
      };
      
      res.json(summary);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = systemMetricController;
