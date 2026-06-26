const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { bookingValidators } = require('../services/validators');
const logger = require('../utils/logger');

class BookingController {
  // Create new booking
  static async create(req, res) {
    try {
      const userId = req.user.id;
      const { station_id, booking_time, duration_minutes, payment_method, port_number } = req.body;

      // Get station to calculate price
      const station = await Station.findById(station_id);
      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Stansiya topilmadi'
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

      const booking = await Booking.create({
        user_id: userId,
        station_id,
        booking_time,
        duration_minutes,
        total_amount: totalAmount,
        prepaid_amount: prepaidAmount,
        remaining_amount: remainingAmount,
        port_number: assignedPort,
        payment_method,
        status: 'confirmed',
        booking_code: bookingCode
      });

      // Update station availability
      const newAvailablePorts = Math.max(0, station.available_ports - 1);
      await Station.updateAvailability(station_id, newAvailablePorts);

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
      logger.error('Create booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Bron qilishda xatolik'
      });
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
