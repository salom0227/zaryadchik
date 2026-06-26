const { body } = require('express-validator');

const stationValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Station name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required')
      .isLength({ min: 5, max: 200 }).withMessage('Address must be 5-200 characters'),
    body('latitude')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('type')
      .notEmpty().withMessage('Type is required')
      .isIn(['ev', 'power', 'scooter']).withMessage('Invalid type'),
    body('status')
      .optional()
      .isIn(['open', 'busy', 'closed']).withMessage('Invalid status'),
    body('power')
      .trim()
      .notEmpty().withMessage('Power is required'),
    body('total_ports')
      .notEmpty().withMessage('Number of ports is required')
      .isInt({ min: 1, max: 50 }).withMessage('Ports must be 1-50'),
    body('price_per_unit')
      .trim()
      .notEmpty().withMessage('Price is required'),
    body('image_url')
      .optional()
      .isString(),
    body('owner_id')
      .optional()
      .isInt({ min: 1 })
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }),
    body('address')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 }),
    body('latitude')
      .optional()
      .isFloat({ min: -90, max: 90 }),
    body('longitude')
      .optional()
      .isFloat({ min: -180, max: 180 }),
    body('type')
      .optional()
      .isIn(['ev', 'power', 'scooter']),
    body('status')
      .optional()
      .isIn(['open', 'busy', 'closed']),
    body('power')
      .optional()
      .trim(),
    body('total_ports')
      .optional()
      .isInt({ min: 1, max: 50 }),
    body('available_ports')
      .optional()
      .isInt({ min: 0 }),
    body('price_per_unit')
      .optional()
      .trim(),
    body('image_url')
      .optional()
      .isString()
  ]
};

const bookingValidators = {
  create: [
    body('station_id')
      .notEmpty().withMessage('Station ID is required')
      .isInt({ min: 1 }).withMessage('Invalid station ID'),
    body('booking_time')
      .notEmpty().withMessage('Booking time is required')
      .isISO8601().withMessage('Invalid date format'),
    body('duration_minutes')
      .notEmpty().withMessage('Duration is required')
      .isInt({ min: 15, max: 480 }).withMessage('Duration must be 15-480 minutes'),
    body('payment_method')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['payme', 'uzum', 'card']).withMessage('Invalid payment method'),
    body('port_number')
      .optional()
      .isInt({ min: 1 })
  ]
};

module.exports = { stationValidators, bookingValidators };
