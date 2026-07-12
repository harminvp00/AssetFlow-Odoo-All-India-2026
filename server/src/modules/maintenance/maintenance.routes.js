const express = require('express');
const controller = require('./maintenance.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./maintenance.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
