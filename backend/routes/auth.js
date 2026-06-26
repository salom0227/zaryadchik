const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { authValidators } = require('../services/AuthService');
const validate = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const { otpLimiter, authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/send-otp - Send OTP to phone
router.post('/send-otp', 
  otpLimiter,
  authValidators.sendOTP,
  validate,
  AuthController.sendOTP
);

// POST /api/auth/verify-otp - Verify OTP and login/register
router.post('/verify-otp',
  authLimiter,
  authValidators.verifyOTP,
  validate,
  AuthController.verifyOTP
);

// GET /api/auth/profile - Get current user profile
router.get('/profile',
  authMiddleware,
  AuthController.getProfile
);

// PUT /api/auth/profile - Update user profile
router.put('/profile',
  authMiddleware,
  authValidators.updateProfile,
  validate,
  AuthController.updateProfile
);

// POST /api/auth/refresh-token - Refresh access token
router.post('/refresh-token',
  AuthController.refreshToken
);

module.exports = router;
