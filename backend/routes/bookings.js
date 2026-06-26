const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/BookingController');
const { bookingValidators } = require('../services/validators');
const validate = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All booking routes require authentication
router.use(authMiddleware);

// GET /api/bookings/my - Get current user's bookings
router.get('/my', BookingController.getUserBookings);

// POST /api/bookings - Create new booking
router.post('/',
  bookingValidators.create,
  validate,
  BookingController.create
);

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', BookingController.getById);

// PUT /api/bookings/:id/cancel - Cancel booking
router.put('/:id/cancel', BookingController.cancel);

// Admin routes
// GET /api/bookings - Get all bookings (admin only)
router.get('/',
  adminMiddleware,
  BookingController.getAll
);

module.exports = router;
