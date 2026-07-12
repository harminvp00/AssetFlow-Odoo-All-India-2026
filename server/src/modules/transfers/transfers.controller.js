const service = require('./transfers.service');
const mapper = require('./transfers.mapper');
const messages = require('./transfers.messages');

const getTransfers = async (req, res, next) => {
  try {
    const items = await service.getTransfers(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getTransferById = async (req, res, next) => {
  try {
    const item = await service.getTransferById(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const getPendingTransfers = async (req, res, next) => {
  try {
    const items = await service.getPendingTransfers();
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const createTransferRequest = async (req, res, next) => {
  try {
    const newItem = await service.createTransferRequest(req.body, req.user);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const approveTransfer = async (req, res, next) => {
  try {
    const updatedItem = await service.approveTransfer(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_APPROVED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const rejectTransfer = async (req, res, next) => {
  try {
    const updatedItem = await service.rejectTransfer(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_REJECTED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransfers,
  getTransferById,
  getPendingTransfers,
  createTransferRequest,
  approveTransfer,
  rejectTransfer,
};
