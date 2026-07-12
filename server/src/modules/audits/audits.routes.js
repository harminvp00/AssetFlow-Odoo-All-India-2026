const express = require('express');
const controller = require('./audits.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const validation = require('./audits.validation');

const router = express.Router();

router.get('/', controller.getAll);
router.post('/', validationMiddleware(validation.create), controller.create);

module.exports = router;
