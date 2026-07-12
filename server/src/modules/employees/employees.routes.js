const express = require('express');
const controller = require('./employees.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const validation = require('./employees.validation');

const router = express.Router();

router.get('/', authMiddleware, controller.getAll);
router.patch('/:id/role', authMiddleware, roleMiddleware('ADMIN'), validationMiddleware(validation.promote), controller.promote);

module.exports = router;
