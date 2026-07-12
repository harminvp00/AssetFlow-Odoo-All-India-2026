const service = require('./employees.service');
const mapper = require('./employees.mapper');
const messages = require('./employees.messages');

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

const promote = async (req, res, next) => {
  try {
    const updatedItem = await service.update(req.params.id, req.body);
    res.json({
      success: true,
      message: messages.SUCCESS_PROMOTED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  promote,
};
