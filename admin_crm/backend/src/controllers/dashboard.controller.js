const Dashboard = require('../models/Dashboard');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Controller methods for dashboard management
const dashboardController = {
  // Get all dashboards
  getDashboards: async (req, res) => {
    try {
      // Get user's own dashboards and public dashboards
      const dashboards = await Dashboard.find({
        $or: [
          { owner: req.user.id },
          { isPublic: true },
          { 'sharedWith.user': req.user.id }
        ]
      }).sort({ updatedAt: -1 });
      
      res.json(dashboards);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get dashboard by ID
  getDashboardById: async (req, res) => {
    try {
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user has access to this dashboard
      const hasAccess = 
        dashboard.isPublic || 
        dashboard.owner.toString() === req.user.id || 
        dashboard.sharedWith.some(share => share.user.toString() === req.user.id);
      
      if (!hasAccess) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Create a new dashboard
  createDashboard: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        name, 
        description, 
        type, 
        layout, 
        isPublic 
      } = req.body;
      
      // Create new dashboard
      const dashboard = new Dashboard({
        name,
        description,
        type,
        layout: layout || {
          columns: 3,
          widgets: []
        },
        isPublic: isPublic || false,
        owner: req.user.id
      });
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Update a dashboard
  updateDashboard: async (req, res) => {
    try {
      const { 
        name, 
        description, 
        layout, 
        isPublic 
      } = req.body;
      
      // Find dashboard by ID
      let dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user has edit access
      const hasEditAccess = 
        dashboard.owner.toString() === req.user.id || 
        dashboard.sharedWith.some(share => 
          share.user.toString() === req.user.id && share.permission === 'edit'
        );
      
      if (!hasEditAccess) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Update fields
      if (name) dashboard.name = name;
      if (description !== undefined) dashboard.description = description;
      if (layout) dashboard.layout = layout;
      if (isPublic !== undefined) dashboard.isPublic = isPublic;
      
      dashboard.updatedAt = Date.now();
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Delete a dashboard
  deleteDashboard: async (req, res) => {
    try {
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user is the owner
      if (dashboard.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Check if it's the default dashboard
      if (dashboard.isDefault) {
        return res.status(400).json({ msg: 'Cannot delete the default dashboard' });
      }
      
      await dashboard.remove();
      
      res.json({ msg: 'Dashboard removed' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Add a widget to a dashboard
  addWidget: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { 
        title, 
        type, 
        dataSource, 
        visualization, 
        position 
      } = req.body;
      
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user has edit access
      const hasEditAccess = 
        dashboard.owner.toString() === req.user.id || 
        dashboard.sharedWith.some(share => 
          share.user.toString() === req.user.id && share.permission === 'edit'
        );
      
      if (!hasEditAccess) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Create widget
      const widget = {
        id: new mongoose.Types.ObjectId().toString(),
        title,
        type,
        dataSource,
        visualization,
        position
      };
      
      // Add widget to dashboard
      dashboard.addWidget(widget);
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Update a widget in a dashboard
  updateWidget: async (req, res) => {
    try {
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user has edit access
      const hasEditAccess = 
        dashboard.owner.toString() === req.user.id || 
        dashboard.sharedWith.some(share => 
          share.user.toString() === req.user.id && share.permission === 'edit'
        );
      
      if (!hasEditAccess) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Update widget
      const success = dashboard.updateWidget(req.params.widgetId, req.body);
      
      if (!success) {
        return res.status(404).json({ msg: 'Widget not found' });
      }
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Remove a widget from a dashboard
  removeWidget: async (req, res) => {
    try {
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user has edit access
      const hasEditAccess = 
        dashboard.owner.toString() === req.user.id || 
        dashboard.sharedWith.some(share => 
          share.user.toString() === req.user.id && share.permission === 'edit'
        );
      
      if (!hasEditAccess) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Remove widget
      const success = dashboard.removeWidget(req.params.widgetId);
      
      if (!success) {
        return res.status(404).json({ msg: 'Widget not found' });
      }
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Get dashboards by type
  getDashboardsByType: async (req, res) => {
    try {
      const dashboards = await Dashboard.find({
        type: req.params.type,
        $or: [
          { owner: req.user.id },
          { isPublic: true },
          { 'sharedWith.user': req.user.id }
        ]
      }).sort({ name: 1 });
      
      res.json(dashboards);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get default dashboard
  getDefaultDashboard: async (req, res) => {
    try {
      // First try to find user's personal default
      let dashboard = await Dashboard.findOne({
        owner: req.user.id,
        isDefault: true
      });
      
      // If not found, get system default
      if (!dashboard) {
        dashboard = await Dashboard.findDefaultDashboard();
      }
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'No default dashboard found' });
      }
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Set a dashboard as default
  setDefaultDashboard: async (req, res) => {
    try {
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user is the owner
      if (dashboard.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Clear any existing default for this user
      await Dashboard.updateMany(
        { owner: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
      
      // Set this dashboard as default
      dashboard.isDefault = true;
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  },

  // Share a dashboard with users
  shareDashboard: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { users, permission } = req.body;
      
      const dashboard = await Dashboard.findById(req.params.id);
      
      if (!dashboard) {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      
      // Check if user is the owner
      if (dashboard.owner.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Access denied' });
      }
      
      // Update shared users
      const currentSharedUsers = dashboard.sharedWith.map(share => share.user.toString());
      
      for (const userId of users) {
        if (!currentSharedUsers.includes(userId)) {
          dashboard.sharedWith.push({
            user: userId,
            permission
          });
        } else {
          // Update existing permission
          const shareIndex = dashboard.sharedWith.findIndex(
            share => share.user.toString() === userId
          );
          dashboard.sharedWith[shareIndex].permission = permission;
        }
      }
      
      dashboard.updatedAt = Date.now();
      
      await dashboard.save();
      
      res.json(dashboard);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Dashboard not found' });
      }
      res.status(500).send('Server Error');
    }
  }
};

module.exports = dashboardController;
