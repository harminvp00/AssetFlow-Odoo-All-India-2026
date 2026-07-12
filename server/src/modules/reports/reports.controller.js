const service = require('./reports.service');
const messages = require('./reports.messages');

const getSummary = async (req, res, next) => {
  try {
    const data = await service.getSummary();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getUtilization = async (req, res, next) => {
  try {
    const data = await service.getUtilization();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenance = async (req, res, next) => {
  try {
    const data = await service.getMaintenance();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getUtilization,
  getMaintenance,
};
