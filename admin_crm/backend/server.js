const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const leadsRoutes = require('./src/routes/leads.routes');
const campaignsRoutes = require('./src/routes/campaigns.routes');
const pipelineRoutes = require('./src/routes/pipeline.routes');
const formsRoutes = require('./src/routes/forms.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/analytics/sales', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Lear Cyber Tech Admin CRM API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
