const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 1.1 POST /auth/send-otp
router.post('/send-otp', authController.sendOtp);

// 1.2 POST /auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// 1.3 POST /auth/register-shopkeeper
router.post('/register-shopkeeper', authController.registerShopkeeper);

// 1.4 GET /auth/me
router.get('/me', authenticate, authController.getMe);

// 1.5 POST /auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// 1.6 POST /auth/logout
router.post('/logout', authenticate, authController.logout);

// 1.7 POST /auth/resend-otp
router.post('/resend-otp', authController.resendOtp);

module.exports = router;
