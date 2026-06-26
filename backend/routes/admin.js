const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [stationStats, totalBookings, totalUsers, revenueByMethod] = await Promise.all([
      Station.getStats(),
      Booking.getTodayBookings(),
      User.count(),
      Booking.getRevenueByPaymentMethod()
    ]);

    res.json({
      success: true,
      data: {
        stations: stationStats,
        todayBookings: totalBookings,
        totalUsers,
        revenueByMethod
      }
    });
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard ma\'lumotlarini yuklashda xatolik'
    });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const users = await User.findAll(parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchilarni yuklashda xatolik'
    });
  }
});

// PUT /api/admin/users/:id/block - Block user
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.block(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    logger.info(`User blocked: ${id}`);

    res.json({
      success: true,
      message: 'Foydalanuvchi bloklandi',
      data: user
    });
  } catch (error) {
    logger.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchini bloklashda xatolik'
    });
  }
});

// PUT /api/admin/users/:id/unblock - Unblock user
router.put('/users/:id/unblock', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.unblock(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    logger.info(`User unblocked: ${id}`);

    res.json({
      success: true,
      message: 'Foydalanuvchi blokdan chiqarildi',
      data: user
    });
  } catch (error) {
    logger.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Foydalanuvchini blokdan chiqarishda xatolik'
    });
  }
});

module.exports = router;
