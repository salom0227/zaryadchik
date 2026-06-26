const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

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

// POST /api/admin/stations - Create new station
router.post('/stations',
  body('name').trim().notEmpty().withMessage('Stansiya nomi required'),
  body('address').trim().notEmpty().withMessage('Manzil required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude noto\'g\'ri'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude noto\'g\'ri'),
  body('type').trim().notEmpty().withMessage('Stansiya turi required'),
  body('price_per_minute').isFloat({ min: 0 }).withMessage('Narx musbat bo\'lishi kerak'),
  validate,
  async (req, res) => {
    try {
      const stationData = req.body;
      
      // Handle image upload if present
      if (req.file) {
        stationData.image_url = `/uploads/${req.file.filename}`;
      }

      const station = await Station.create(stationData);

      logger.info(`Admin created station: ${station.name}`);

      res.status(201).json({
        success: true,
        message: 'Stansiya qo\'shildi',
        data: station
      });
    } catch (error) {
      logger.error('Admin create station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani qo\'shishda xatolik'
      });
    }
  }
);

// PUT /api/admin/stations/:id - Update station
router.put('/stations/:id',
  param('id').isInt().withMessage('Stansiya ID raqam bo\'lishi kerak'),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Handle image upload if present
      if (req.file) {
        updates.image_url = `/uploads/${req.file.filename}`;
      }

      const station = await Station.update(id, updates);

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Stansiya topilmadi'
        });
      }

      logger.info(`Admin updated station: ${station.name}`);

      res.json({
        success: true,
        message: 'Stansiya yangilandi',
        data: station
      });
    } catch (error) {
      logger.error('Admin update station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani yangilashda xatolik'
      });
    }
  }
);

// DELETE /api/admin/stations/:id - Delete station
router.delete('/stations/:id',
  param('id').isInt().withMessage('Stansiya ID raqam bo\'lishi kerak'),
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const station = await Station.delete(id);

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Stansiya topilmadi'
        });
      }

      logger.info(`Admin deleted station: ${station.name}`);

      res.json({
        success: true,
        message: 'Stansiya o\'chirildi'
      });
    } catch (error) {
      logger.error('Admin delete station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani o\'chirishda xatolik'
      });
    }
  }
);

// GET /api/admin/stations - Get all stations with filters
router.get('/stations', async (req, res) => {
  try {
    const { type, status, search } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (search) filters.search = search;

    const stations = await Station.findAll(filters);

    res.json({
      success: true,
      data: stations
    });
  } catch (error) {
    logger.error('Admin get stations error:', error);
    res.status(500).json({
      success: false,
      message: 'Stansiyalarni yuklashda xatolik'
    });
  }
});

module.exports = router;
