const express = require('express');
const controller = require('./locations.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./locations.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
