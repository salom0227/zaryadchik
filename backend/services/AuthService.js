const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

class AuthService {
  static async sendOTP(phone) {
    // Mock OTP generation - in production, integrate with SMS provider
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP in memory/cache with expiration (in production, use Redis)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // For development, log the OTP
    console.log(`[OTP] Phone: ${phone}, Code: ${otp}, Expires: ${otpExpiry}`);
    
    return { otp, expiry: otpExpiry };
  }

  static async verifyOTP(phone, otp, storedOTP) {
    if (!storedOTP) {
      return { valid: false, message: 'OTP not found or expired' };
    }
    
    if (otp !== storedOTP.otp) {
      return { valid: false, message: 'Invalid OTP code' };
    }
    
    if (new Date() > storedOTP.expiry) {
      return { valid: false, message: 'OTP has expired' };
    }
    
    return { valid: true, message: 'OTP verified successfully' };
  }

  static generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, phone: user.phone, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static validateAdminCredentials(username, password) {
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    return username === adminUser && password === adminPass;
  }
}

// Validation rules
const authValidators = {
  sendOTP: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\d{9,15}$/).withMessage('Invalid phone number format')
  ],
  
  verifyOTP: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\d{9,15}$/).withMessage('Invalid phone number format'),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP code is required')
      .isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits')
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format'),
    body('car_types')
      .optional()
      .isArray().withMessage('Car types must be an array')
  ]
};

module.exports = { AuthService, authValidators };
