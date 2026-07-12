const express = require('express');
const controller = require('./audits.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./audits.validation');

const router = express.Router();

// Protect all routes with authentication
router.use(authMiddleware);

router.get('/', validationMiddleware(validation.getAll), controller.getAuditCycles);
router.get('/:id/details', validationMiddleware(validation.getById), controller.getAuditDetails);
router.get('/:id/history', validationMiddleware(validation.getHistory), controller.getAuditHistory);
router.get('/:id/discrepancy-report', validationMiddleware(validation.getById), controller.getDiscrepancyReport);
router.get('/:id', validationMiddleware(validation.getById), controller.getAuditCycleById);

router.post('/', roleMiddleware('ADMIN'), validationMiddleware(validation.create), controller.createAuditCycle);
router.patch('/:id/start', roleMiddleware('ADMIN'), validationMiddleware(validation.start), controller.startAuditCycle);
router.post('/:id/verify', validationMiddleware(validation.verify), controller.verifyAsset);
router.patch('/:id/close', roleMiddleware('ADMIN'), validationMiddleware(validation.close), controller.closeAuditCycle);

module.exports = router;
