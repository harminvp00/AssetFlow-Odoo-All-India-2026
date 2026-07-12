const express = require('express');
const controller = require('./bookings.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const validation = require('./bookings.validation');

const router = express.Router();

// Protect all routes with authentication
router.use(authMiddleware);

router.get('/', validationMiddleware(validation.getAll), controller.getBookings);
router.get('/calendar', validationMiddleware(validation.getCalendar), controller.getBookingCalendar);
router.get('/upcoming', validationMiddleware(validation.getUpcoming), controller.getUpcomingBookings);
router.get('/user/:userId', validationMiddleware(validation.getByUser), controller.getBookingsByUser);
router.get('/asset/:assetId', validationMiddleware(validation.getByAsset), controller.getBookingsByAsset);
router.get('/:id', validationMiddleware(validation.getById), controller.getBookingById);

router.post('/', validationMiddleware(validation.create), controller.createBooking);
router.patch('/:id/cancel', validationMiddleware(validation.cancel), controller.cancelBooking);

module.exports = router;
