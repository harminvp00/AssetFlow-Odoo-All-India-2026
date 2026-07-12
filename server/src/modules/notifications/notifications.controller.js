const service = require('./notifications.service');
const mapper = require('./notifications.mapper');
const messages = require('./notifications.messages');

const getNotifications = async (req, res, next) => {
  try {
    const items = await service.getNotifications(req.query, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadNotifications = async (req, res, next) => {
  try {
    const items = await service.getUnreadNotifications(req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationById = async (req, res, next) => {
  try {
    const item = await service.getNotificationById(req.params.id, req.user);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await service.getUnreadCount(req.user);
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const updatedItem = await service.markNotificationAsRead(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_UPDATED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await service.markAllNotificationsAsRead(req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_UPDATED,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Compatibility aliases
const getAll = getNotifications;
const create = async (req, res, next) => {
  try {
    const newItem = await service.createNotification(req.body);
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
  getNotifications,
  getUnreadNotifications,
  getNotificationById,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  // Compatibility aliases
  getAll,
  create,
};
