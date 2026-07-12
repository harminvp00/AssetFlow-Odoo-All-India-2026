const express = require('express');
const controller = require('./allocations.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./allocations.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
