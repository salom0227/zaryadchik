const Station = require('../models/Station');
const Booking = require('../models/Booking');
const validate = require('../middleware/validate');
const { stationValidators } = require('../services/validators');
const logger = require('../utils/logger');

class StationController {
  // Get all stations with filters
  static async getAll(req, res) {
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
      logger.error('Get stations error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyalarni yuklashda xatolik'
      });
    }
  }

  // Get single station by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const station = await Station.findById(id);

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Stansiya topilmadi'
        });
      }

      res.json({
        success: true,
        data: station
      });
    } catch (error) {
      logger.error('Get station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani yuklashda xatolik'
      });
    }
  }

  // Create new station (admin only)
  static async create(req, res) {
    try {
      const stationData = req.body;
      
      // Handle image upload if present
      if (req.file) {
        stationData.image_url = `/uploads/${req.file.filename}`;
      }

      const station = await Station.create(stationData);

      logger.info(`Station created: ${station.name}`);

      res.status(201).json({
        success: true,
        message: 'Stansiya qo\'shildi',
        data: station
      });
    } catch (error) {
      logger.error('Create station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani qo\'shishda xatolik'
      });
    }
  }

  // Update station (admin only)
  static async update(req, res) {
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

      logger.info(`Station updated: ${station.name}`);

      res.json({
        success: true,
        message: 'Stansiya yangilandi',
        data: station
      });
    } catch (error) {
      logger.error('Update station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani yangilashda xatolik'
      });
    }
  }

  // Delete station (admin only)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const station = await Station.delete(id);

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Stansiya topilmadi'
        });
      }

      logger.info(`Station deleted: ${station.name}`);

      res.json({
        success: true,
        message: 'Stansiya o\'chirildi'
      });
    } catch (error) {
      logger.error('Delete station error:', error);
      res.status(500).json({
        success: false,
        message: 'Stansiyani o\'chirishda xatolik'
      });
    }
  }

  // Get station statistics
  static async getStats(req, res) {
    try {
      const stats = await Station.getStats();
      const totalBookings = await Booking.getTodayBookings();

      res.json({
        success: true,
        data: {
          stations: stats,
          todayBookings: totalBookings
        }
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Statistika yuklashda xatolik'
      });
    }
  }
}

module.exports = StationController;
