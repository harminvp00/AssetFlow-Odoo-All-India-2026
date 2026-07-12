
const express = require('express');
const passport = require('passport');
const controller = require('./auth.controller');
const validationMiddleware = require('../../middlewares/validation.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const validation = require('./auth.validation');

const router = express.Router();

router.post('/signup', validationMiddleware(validation.signup), controller.signup);
router.post('/login', validationMiddleware(validation.login), controller.login);
router.post('/logout', controller.logout);
router.post('/refresh', controller.refresh);
router.get('/me', authMiddleware, controller.me);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), controller.googleCallback);

module.exports = router;
