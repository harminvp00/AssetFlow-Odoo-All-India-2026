const logger = require('../../config/logger');

const triggerNotification = (event, data) => {
  logger.info(`[EVENT] Notification triggered for event: ${event}`);
  // Handle event processing here
};

module.exports = {
  triggerNotification,
};
