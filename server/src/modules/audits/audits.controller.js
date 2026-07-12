const service = require('./audits.service');
const mapper = require('./audits.mapper');
const messages = require('./audits.messages');

const getAuditCycles = async (req, res, next) => {
  try {
    const items = await service.getAuditCycles(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getAuditCycleById = async (req, res, next) => {
  try {
    const item = await service.getAuditCycleById(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const getAuditDetails = async (req, res, next) => {
  try {
    const item = await service.getAuditDetails(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const getAuditHistory = async (req, res, next) => {
  try {
    const items = await service.getAuditHistory(req.params.id);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getDiscrepancyReport = async (req, res, next) => {
  try {
    const report = await service.getDiscrepancyReport(req.params.id);
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const createAuditCycle = async (req, res, next) => {
  try {
    const newItem = await service.createAuditCycle(req.body, req.user);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const startAuditCycle = async (req, res, next) => {
  try {
    const updatedItem = await service.startAuditCycle(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_STARTED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const verifyAsset = async (req, res, next) => {
  try {
    const newItem = await service.verifyAsset(req.params.id, req.body, req.user);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_VERIFIED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const closeAuditCycle = async (req, res, next) => {
  try {
    const updatedItem = await service.closeAuditCycle(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_CLOSED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

// Aliases for compatibility
const getAll = getAuditCycles;
const create = createAuditCycle;
const getAuditHistoryByAsset = getAuditHistory;

module.exports = {
  getAuditCycles,
  getAuditCycleById,
  getAuditDetails,
  getAuditHistory,
  getDiscrepancyReport,
  createAuditCycle,
  startAuditCycle,
  verifyAsset,
  closeAuditCycle,
  // Aliases for compatibility
  getAll,
  create,
  getAuditHistoryByAsset,
};
