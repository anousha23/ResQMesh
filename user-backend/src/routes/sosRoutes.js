const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sosController');

// Trigger Emergency SOS
router.post('/', sosController.createSOS);

// Get Active SOS Status Lifecycle
router.get('/status', sosController.getSOSStatus);

// Cancel / Resolve Active SOS Request
router.post('/:id/cancel', sosController.cancelSOS);

module.exports = router;
