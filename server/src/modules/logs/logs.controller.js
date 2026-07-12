const service = require('./logs.service');

const getActivityLogs = async (req, res, next) => {
  try {
    const items = await service.getActivityLogs(req.query, req.user);
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getAssetHistory = async (req, res, next) => {
  try {
    const items = await service.getAssetHistory(req.params.assetId);
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

const getUserActivity = async (req, res, next) => {
  try {
    const items = await service.getUserActivity(req.params.userId, req.user);
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
  getAssetHistory,
  getUserActivity,
};
