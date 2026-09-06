const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

// Onboarding Step 1 — Personal Information (supports profile_photo avatar upload)
router.post('/onboarding/step1', upload.single('profile_photo'), userController.onboardingStep1);

// Onboarding Step 2 — Medical Details
router.post('/onboarding/step2', userController.onboardingStep2);

// Onboarding Step 3 — Emergency Contact & Complete Onboarding
router.post('/onboarding/step3', userController.onboardingStep3);

// Get Current User Profile
router.get('/profile', userController.getProfile);

// Update Preferred Language
router.put('/language', userController.updateLanguage);

// Log Out & Start Again (Reset Session & Profile)
router.post('/reset', userController.resetProfile);

module.exports = router;
