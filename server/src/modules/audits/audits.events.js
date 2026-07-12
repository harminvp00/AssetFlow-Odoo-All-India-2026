const logger = require('../../config/logger');

const logAuditEvent = (action, details) => {
  logger.info(`[EVENT] Audit log registered: ${action}`);
  // Save audit log to database
};

module.exports = {
  logAuditEvent,
};
