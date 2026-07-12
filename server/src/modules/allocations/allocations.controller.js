const service = require('./allocations.service');
const mapper = require('./allocations.mapper');
const messages = require('./allocations.messages');

const getAllocations = async (req, res, next) => {
  try {
    const items = await service.getAllAllocations(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getAllocationById = async (req, res, next) => {
  try {
    const item = await service.getAllocationById(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const allocateAsset = async (req, res, next) => {
  try {
    const newItem = await service.allocateAsset(req.body, req.user);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const returnAsset = async (req, res, next) => {
  try {
    const updatedItem = await service.returnAsset(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Asset returned and checked in successfully.',
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllocations,
  getAllocationById,
  allocateAsset,
  returnAsset,
};
