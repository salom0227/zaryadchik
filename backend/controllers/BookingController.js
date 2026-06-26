const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { bookingValidators } = require('../services/validators');
const logger = require('../utils/logger');
const pool = require('../config/database');

class BookingController {
  // Create new booking with transaction to prevent race conditions
  static async create(req, res) {
    const client = await pool.connect();
    
    try {
      const userId = req.user.id;
      const { station_id, booking_time, duration_minutes, payment_method, port_number } = req.body;

      // Begin transaction
      await client.query('BEGIN');

      // Get station with lock to prevent race conditions
      const stationResult = await client.query(
        'SELECT * FROM stations WHERE id = $1 FOR UPDATE',
        [station_id]
      );
      
      const station = stationResult.rows[0];
      
      if (!station) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Stansiya topilmadi'
        });
      }

      // Check availability within transaction
      if (station.available_ports < 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Band qilish uchun bo\'sh portlar mavjud emas'
        });
      }

      // Calculate pricing based on station type and duration
      const basePrice = parseInt(station.price_per_unit.replace(/\D/g, '')) || 2500;
      const hours = duration_minutes / 60;
      
      let totalAmount;
      if (station.type === 'ev') {
        // EV charging: price per kWh, estimate 15kWh per hour
        totalAmount = Math.round(basePrice * 15 * hours);
      } else if (station.type === 'power') {
        // Powerbank: price per hour
        totalAmount = Math.round(basePrice * hours);
      } else {
        // Scooter: price per hour
        totalAmount = Math.round(basePrice * hours);
      }

      const prepaidAmount = Math.round(totalAmount * 0.3); // 30% prepayment
      const remainingAmount = totalAmount - prepaidAmount;

      // Generate booking code
      const bookingCode = `ZU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 8999)}`;

      // Determine assigned port
      const assignedPort = port_number || 1;

      // Create booking within transaction
      const bookingQuery = `
        INSERT INTO bookings (user_id, station_id, booking_time, duration_minutes, total_amount, prepaid_amount, remaining_amount, port_number, payment_method, status, booking_code)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const bookingValues = [userId, station_id, booking_time, duration_minutes, totalAmount, prepaidAmount, remainingAmount, assignedPort, payment_method, 'confirmed', bookingCode];
      const bookingResult = await client.query(bookingQuery, bookingValues);
      const booking = bookingResult.rows[0];

      // Update station availability within transaction
      const newAvailablePorts = station.available_ports - 1;
      await client.query(
        'UPDATE stations SET available_ports = $1, updated_at = NOW() WHERE id = $2',
        [newAvailablePorts, station_id]
      );

      // Commit transaction
      await client.query('COMMIT');

      logger.info(`Booking created: ${bookingCode} by user ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Bron tasdiqlandi',
        data: {
          ...booking,
          station_name: station.name,
          station_address: station.address
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      logger.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Bron qilishda xatolik'
      });
    } finally {
      client.release();
    }
  }

  // Get user's bookings
  static async getUserBookings(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const bookings = await Booking.findByUser(userId, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      logger.error('Get user bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Bronlarni yuklashda xatolik'
      });
    }
  }

  // Get booking by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Bron topilmadi'
        });
      }

      // Check if user owns this booking or is admin
      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Ruxsat yo\'q'
        });
      }

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      logger.error('Get booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Bronni yuklashda xatolik'
      });
    }
  }

  // Cancel booking
  static async cancel(req, res) {
    try {
      const { id } = req.params;
      const booking = await Booking.findById(id);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Bron topilmadi'
        });
      }

      // Check if user owns this booking or is admin
      if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Ruxsat yo\'q'
        });
      }

      const cancelledBooking = await Booking.cancel(id);

      // Update station availability
      const station = await Station.findById(booking.station_id);
      if (station) {
        await Station.updateAvailability(station.id, station.available_ports + 1);
      }

      logger.info(`Booking cancelled: ${id}`);

      res.json({
        success: true,
        message: 'Bron bekor qilindi',
        data: cancelledBooking
      });
    } catch (error) {
      logger.error('Cancel booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Bronni bekor qilishda xatolik'
      });
    }
  }

  // Admin: Get all bookings
  static async getAll(req, res) {
    try {
      const { limit = 100, offset = 0, status, station_id } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (station_id) filters.station_id = parseInt(station_id);

      const bookings = await Booking.findAll(parseInt(limit), parseInt(offset), filters);

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      logger.error('Get all bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Bronlarni yuklashda xatolik'
      });
    }
  }
}

module.exports = BookingController;
