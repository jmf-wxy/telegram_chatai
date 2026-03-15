const express = require('express');
const botManager = require('./bot/index');
const logger = require('./utils/logger');
const errorMiddleware = require('./middleware/error');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  // TODO: Implement actual stats
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    users: 0 // Placeholder
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
