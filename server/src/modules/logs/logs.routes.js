const express = require('express');
const controller = require('./logs.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./logs.validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('ADMIN'), validationMiddleware(validation.getAll), controller.getActivityLogs);
router.get('/assets/:assetId', validationMiddleware(validation.getAssetHistory), controller.getAssetHistory);
router.get('/users/:userId', validationMiddleware(validation.getUserActivity), controller.getUserActivity);

module.exports = router;
