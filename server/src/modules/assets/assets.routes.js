const express = require('express');
const controller = require('./assets.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./assets.validation');

const router = express.Router();

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.post('/', authMiddleware, roleMiddleware('ADMIN', 'MANAGER'), validationMiddleware(validation.create), controller.create);
router.patch('/:id', authMiddleware, roleMiddleware('ADMIN', 'MANAGER'), validationMiddleware(validation.update), controller.update);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), controller.remove);

module.exports = router;
