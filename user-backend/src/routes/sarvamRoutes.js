const express = require('express');
const router = express.Router();
const sarvamController = require('../controllers/sarvamController');

// Get UI Phrase Dictionary for chosen Indian language
router.get('/dictionary', sarvamController.getDictionary);

// Live translate text using Sarvam AI
router.post('/translate', sarvamController.translate);

module.exports = router;
