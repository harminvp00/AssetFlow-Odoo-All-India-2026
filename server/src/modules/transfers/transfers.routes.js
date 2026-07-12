const express = require('express');
const controller = require('./transfers.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./transfers.validation');

const router = express.Router();

// Protect all routes with authentication
router.use(authMiddleware);

router.get('/', validationMiddleware(validation.getAll), controller.getTransfers);
router.get('/pending', validationMiddleware(validation.getPending), controller.getPendingTransfers);
router.get('/:id', validationMiddleware(validation.getById), controller.getTransferById);

router.post('/', validationMiddleware(validation.create), controller.createTransferRequest);

router.patch(
  '/:id/approve',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.approve),
  controller.approveTransfer
);

router.patch(
  '/:id/reject',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.reject),
  controller.rejectTransfer
);

module.exports = router;
