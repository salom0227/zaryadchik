const { AuthService, authValidators } = require('../services/AuthService');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { otpLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

class AuthController {
  // Send OTP for phone authentication
  static async sendOTP(req, res) {
    try {
      const { phone } = req.body;

      // Generate and store OTP
      const otpData = await AuthService.sendOTP(phone);
      otpStore.set(phone, otpData);

      logger.info(`OTP sent to ${phone}`);

      res.json({
        success: true,
        message: 'SMS kod yuborildi',
        data: { phone }
      });
    } catch (error) {
      logger.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'SMS kod yuborishda xatolik'
      });
    }
  }

  // Verify OTP and login/register
  static async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      const storedOTP = otpStore.get(phone);
      const result = await AuthService.verifyOTP(phone, otp, storedOTP);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      // Remove used OTP
      otpStore.delete(phone);

      // Find or create user
      let user = await User.findByPhone(phone);

      if (!user) {
        // New user - create account
        user = await User.create({ phone, name: null, email: null, car_types: [] });
        
        const tokens = AuthService.generateTokens(user);
        
        return res.json({
          success: true,
          message: 'Ro\'yxatdan o\'tish yakunlandi',
          isNewUser: true,
          data: {
            user: {
              id: user.id,
              phone: user.phone,
              name: user.name,
              email: user.email,
              car_types: user.car_types
            },
            ...tokens
          }
        });
      }

      // Existing user - generate tokens
      const tokens = AuthService.generateTokens(user);

      logger.info(`User logged in: ${phone}`);

      res.json({
        success: true,
        message: 'Kirish muvaffaqiyatli amalga oshirildi',
        isNewUser: false,
        data: {
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            car_types: user.car_types,
            is_blocked: user.is_blocked
          },
          ...tokens
        }
      });
    } catch (error) {
      logger.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Tasdiqlashda xatolik'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          car_types: user.car_types,
          created_at: user.created_at
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profilni yuklashda xatolik'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { name, email, car_types } = req.body;
      const userId = req.user.id;

      const updatedUser = await User.update(userId, { name, email, car_types });

      logger.info(`Profile updated for user ${userId}`);

      res.json({
        success: true,
        message: 'Profil yangilandi',
        data: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          name: updatedUser.name,
          email: updatedUser.email,
          car_types: updatedUser.car_types
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Profilni yangilashda xatolik'
      });
    }
  }

  // Refresh access token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      const tokens = AuthService.generateTokens(user);

      res.json({
        success: true,
        data: tokens
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }
}

module.exports = AuthController;
