const express = require('express');
const router = express.Router();
const StationController = require('../controllers/StationController');
const { stationValidators } = require('../services/validators');
const validate = require('../middleware/validate');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'station-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/stations - Get all stations (public)
router.get('/', StationController.getAll);

// GET /api/stations/stats - Get station statistics (public)
router.get('/stats', StationController.getStats);

// GET /api/stations/:id - Get single station (public)
router.get('/:id', StationController.getById);

// POST /api/stations - Create new station (admin only)
// Note: Admin can also use /api/admin/stations
router.post('/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  stationValidators.create,
  validate,
  StationController.create
);

// PUT /api/stations/:id - Update station (admin only)
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  stationValidators.update,
  validate,
  StationController.update
);

// DELETE /api/stations/:id - Delete station (admin only)
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  StationController.delete
);

module.exports = router;
