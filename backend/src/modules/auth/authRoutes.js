const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticate } = require('../../middleware/auth');

router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/switch-role', authenticate, authController.switchRole);

module.exports = router;
