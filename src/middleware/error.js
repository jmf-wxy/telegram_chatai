process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  const logger = require('../utils/logger');
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  const logger = require('../utils/logger');
  logger.error('Unhandled Rejection', { reason: String(reason) });
});

module.exports = function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to Express' default error handler
  if (res.headersSent) {
    return next(err);
  }

  const logger = require('../utils/logger');
  logger.error('HTTP Error', {
    status: err.status || 500,
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    stack: err.stack
  });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode
    }
  });
};
