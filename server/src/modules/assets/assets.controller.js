const service = require('./assets.service');
const mapper = require('./assets.mapper');
const messages = require('./assets.messages');

const getAll = async (req, res, next) => {
  try {
    const items = await service.getAll(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await service.getById(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const newItem = await service.create(req.body);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const updatedItem = await service.update(req.params.id, req.body);
    res.json({
      success: true,
      message: messages.SUCCESS_UPDATED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id);
    res.json({
      success: true,
      message: messages.SUCCESS_DELETED,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
