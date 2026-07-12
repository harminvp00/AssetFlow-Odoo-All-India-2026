const service = require('./maintenance.service');
const mapper = require('./maintenance.mapper');
const messages = require('./maintenance.messages');

const getAll = async (req, res, next) => {
  try {
    const items = await service.getAll();
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
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

module.exports = {
  getAll,
  create,
};
