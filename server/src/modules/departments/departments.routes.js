const express = require('express');
const controller = require('./departments.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./departments.validation');

const router = express.Router();

router.get('/', authMiddleware, controller.getAll);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), validationMiddleware(validation.create), controller.create);
router.patch('/:id', authMiddleware, roleMiddleware('ADMIN'), validationMiddleware(validation.update), controller.update);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), controller.remove);

module.exports = router;
