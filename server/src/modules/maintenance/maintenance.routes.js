const express = require('express');
const controller = require('./maintenance.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./maintenance.validation');

const router = express.Router();

// Protect all routes with authentication
router.use(authMiddleware);

router.get('/', validationMiddleware(validation.getAll), controller.getMaintenanceRequests);
router.get('/pending', validationMiddleware(validation.getPending), controller.getPendingMaintenanceRequests);
router.get('/history/:assetId', validationMiddleware(validation.getHistory), controller.getMaintenanceHistoryByAsset);
router.get('/:id', validationMiddleware(validation.getById), controller.getMaintenanceRequestById);

router.post('/', validationMiddleware(validation.create), controller.raiseMaintenanceRequest);

router.patch(
  '/:id/approve',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.approve),
  controller.approveMaintenanceRequest
);

router.patch(
  '/:id/reject',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.reject),
  controller.rejectMaintenanceRequest
);

router.patch(
  '/:id/assign-technician',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.assign),
  controller.assignTechnician
);

router.patch(
  '/:id/start',
  validationMiddleware(validation.start),
  controller.startMaintenance
);

router.patch(
  '/:id/resolve',
  validationMiddleware(validation.resolve),
  controller.resolveMaintenance
);

module.exports = router;
