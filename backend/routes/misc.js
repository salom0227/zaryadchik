const express = require('express');
const path = require('path');

const router = express.Router();

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
