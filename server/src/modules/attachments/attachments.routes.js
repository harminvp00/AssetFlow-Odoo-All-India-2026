const express = require('express');
const controller = require('./attachments.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { uploadSingle } = require('../../middlewares/upload.middleware');

const router = express.Router();

router.post('/upload', authMiddleware, uploadSingle('file'), controller.upload);

module.exports = router;
