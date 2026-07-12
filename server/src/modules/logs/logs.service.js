const repository = require('./logs.repository');

const createActivityLog = async (data) => {
  const { action, userId, assetId, details } = data;

  if (!action) {
    const error = new Error('Invalid activity log request.');
    error.statusCode = 400;
    throw error;
  }

  if (userId) {
    const user = await repository.findUserById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  if (assetId) {
    const asset = await repository.findAssetById(assetId);
    if (!asset) {
      const error = new Error('Asset not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  return repository.createActivityLog({
    action,
    userId,
    assetId,
    details: details || {},
  });
};

const getActivityLogs = async (filters = {}, currentUser) => {
  const isAuthorized = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  if (!isAuthorized) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }
  return repository.findActivityLogs(filters);
};

const getAssetHistory = async (assetId) => {
  const asset = await repository.findAssetById(assetId);
  if (!asset) {
    const error = new Error('Asset not found.');
    error.statusCode = 404;
    throw error;
  }
  return repository.findAssetActivityHistory(assetId);
};

const getUserActivity = async (userId, currentUser) => {
  const isSelf = currentUser.id === userId;
  const isAdmin = currentUser.role === 'ADMIN';
  if (!isSelf && !isAdmin) {
    const error = new Error('Unauthorized action.');
    error.statusCode = 403;
    throw error;
  }

  const user = await repository.findUserById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return repository.findUserActivityHistory(userId);
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getAssetHistory,
  getUserActivity,
};
