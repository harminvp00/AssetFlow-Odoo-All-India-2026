const logger = require('../config/logger');
const env = require('../config/env');

const errorMiddleware = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error using internal logger
  logger.error(`[ERROR] Status: ${statusCode} | Message: ${message} | Stack: ${err.stack}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
