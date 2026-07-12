const express = require('express');
const controller = require('./notifications.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const validation = require('./notifications.validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', validationMiddleware(validation.getAll), controller.getNotifications);
router.get('/unread', controller.getUnreadNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.get('/:id', validationMiddleware(validation.getById), controller.getNotificationById);

router.patch('/read-all', controller.markAllNotificationsAsRead);
router.patch('/:id/read', validationMiddleware(validation.getById), controller.markNotificationAsRead);

module.exports = router;
