const express = require('express');
const controller = require('./reports.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./reports.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
