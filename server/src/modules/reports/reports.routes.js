const express = require('express');
const controller = require('./reports.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/summary', authMiddleware, controller.getSummary);
router.get('/utilization', authMiddleware, controller.getUtilization);
router.get('/maintenance', authMiddleware, controller.getMaintenance);

module.exports = router;
