const service = require('./bookings.service');
const mapper = require('./bookings.mapper');
const messages = require('./bookings.messages');

const getBookings = async (req, res, next) => {
  try {
    const items = await service.getBookings(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const item = await service.getBookingById(req.params.id);
    res.json({
      success: true,
      data: mapper.toDTO(item),
    });
  } catch (error) {
    next(error);
  }
};

const getBookingCalendar = async (req, res, next) => {
  try {
    const items = await service.getBookingCalendar(req.query);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getBookingsByUser = async (req, res, next) => {
  try {
    const items = await service.getBookingsByUser(req.params.userId);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getBookingsByAsset = async (req, res, next) => {
  try {
    const items = await service.getBookingsByAsset(req.params.assetId);
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const getUpcomingBookings = async (req, res, next) => {
  try {
    const items = await service.getUpcomingBookings();
    res.json({
      success: true,
      message: messages.SUCCESS_RETRIEVED,
      data: items.map(mapper.toDTO),
    });
  } catch (error) {
    next(error);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const newItem = await service.createBooking(req.body, req.user);
    res.status(201).json({
      success: true,
      message: messages.SUCCESS_CREATED,
      data: mapper.toDTO(newItem),
    });
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const updatedItem = await service.cancelBooking(req.params.id, req.user);
    res.json({
      success: true,
      message: messages.SUCCESS_CANCELLED,
      data: mapper.toDTO(updatedItem),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookings,
  getBookingById,
  getBookingCalendar,
  getBookingsByUser,
  getBookingsByAsset,
  getUpcomingBookings,
  createBooking,
  cancelBooking,
};
