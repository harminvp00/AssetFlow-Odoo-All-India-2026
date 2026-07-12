const service = require('./maintenance.service');
const mapper = require('./maintenance.mapper');
const messages = require('./maintenance.messages');

const getMaintenanceRequests = async (req, res, next) => {
  try {
    const items = await service.getMaintenanceRequests(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenanceRequestById = async (req, res, next) => {
  try {
    const item = await service.getMaintenanceRequestById(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const getPendingMaintenanceRequests = async (req, res, next) => {
  try {
    const items = await service.getPendingRequests();
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenanceHistoryByAsset = async (req, res, next) => {
  try {
    const items = await service.getMaintenanceHistoryByAsset(req.params.assetId);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const raiseMaintenanceRequest = async (req, res, next) => {
  try {
    const newItem = await service.raiseMaintenanceRequest(req.body, req.user);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const approveMaintenanceRequest = async (req, res, next) => {
  try {
    const updatedItem = await service.approveMaintenanceRequest(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_APPROVED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const rejectMaintenanceRequest = async (req, res, next) => {
  try {
    const updatedItem = await service.rejectMaintenanceRequest(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_REJECTED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const assignTechnician = async (req, res, next) => {
  try {
    const updatedItem = await service.assignTechnician(req.params.id, req.body.technicianId, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_ASSIGNED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const startMaintenance = async (req, res, next) => {
  try {
    const updatedItem = await service.startMaintenance(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_STARTED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const resolveMaintenance = async (req, res, next) => {
  try {
    const updatedItem = await service.resolveMaintenance(req.params.id, req.body.resolutionNotes, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_RESOLVED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

// Aliases for compatibility
const getRequests = getMaintenanceRequests;
const getRequestById = getMaintenanceRequestById;
const getPendingRequests = getPendingMaintenanceRequests;
const createRequest = raiseMaintenanceRequest;
const approveRequest = approveMaintenanceRequest;
const rejectRequest = rejectMaintenanceRequest;
const startRepair = startMaintenance;
const resolveRequest = resolveMaintenance;

module.exports = {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  getPendingMaintenanceRequests,
  getMaintenanceHistoryByAsset,
  raiseMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignTechnician,
  startMaintenance,
  resolveMaintenance,
  // Aliases for compatibility
  getRequests,
  getRequestById,
  getPendingRequests,
  createRequest,
  approveRequest,
  rejectRequest,
  startRepair,
  resolveRequest,
};
