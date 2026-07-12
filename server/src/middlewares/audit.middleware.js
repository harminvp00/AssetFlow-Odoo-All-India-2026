const logger = require('../config/logger');

const auditMiddleware = (actionDescription) => {
  return (req, res, next) => {
    const userId = req.user ? req.user.id : 'ANONYMOUS';
    const email = req.user ? req.user.email : 'N/A';
    const { method, originalUrl, ip } = req;

    // Log the event details
    logger.info(
      `[AUDIT] Action: ${actionDescription || 'API_CALL'} | User: ${userId} (${email}) | Path: ${method} ${originalUrl} | IP: ${ip}`
    );

    next();
  };
};

module.exports = auditMiddleware;
