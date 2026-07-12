const express = require('express');
const controller = require('./allocations.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./allocations.validation');

const router = express.Router();

// Authenticate all routes
router.use(authMiddleware);

router.get('/', validationMiddleware(validation.getAll), controller.getAllocations);
router.get('/:id', validationMiddleware(validation.getById), controller.getAllocationById);

// Create allocation (requires admin/manager permissions)
router.post(
  '/',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.create),
  controller.allocateAsset
);

// Return/Check-in allocation (requires admin/manager permissions)
router.patch(
  '/:id/return',
  roleMiddleware('ADMIN', 'MANAGER'),
  validationMiddleware(validation.returnAsset),
  controller.returnAsset
);

module.exports = router;
