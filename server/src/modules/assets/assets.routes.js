const express = require('express');
const controller = require('./assets.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./assets.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
