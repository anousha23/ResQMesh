const { v4: uuidv4 } = require('uuid');
const { dbGet, dbRun } = require('../config/db');
const sarvamService = require('../services/sarvamService');

class UserController {
  /**
   * Step 1 — Personal Information
   */
  async onboardingStep1(req, res, next) {
    try {
      const { full_name, age, blood_group } = req.body;
      let userId = req.body.user_id;

      if (!userId) {
        userId = `U_${uuidv4().slice(0, 8).toUpperCase()}`;
      }

      let profilePhoto = null;
      if (req.file) {
        profilePhoto = `/uploads/${req.file.filename}`;
      }

      // Check if user already exists
      const existing = await dbGet('SELECT user_id FROM users WHERE user_id = ?', [userId]);

      if (existing) {
        await dbRun(
          `UPDATE users SET full_name = ?, age = ?, blood_group = ?, 
           profile_photo = COALESCE(?, profile_photo), updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [full_name || 'Anonymous', parseInt(age) || 0, blood_group || 'O+', profilePhoto, userId]
        );
      } else {
        await dbRun(
          `INSERT INTO users (user_id, full_name, age, blood_group, profile_photo)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, full_name || 'Anonymous', parseInt(age) || 0, blood_group || 'O+', profilePhoto]
        );
      }

      res.status(200).json({
        success: true,
        message: 'Step 1 completed successfully',
        data: {
          user_id: userId,
          full_name,
          age: parseInt(age) || 0,
          blood_group,
          profile_photo: profilePhoto,
          current_step: 1
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Step 2 — Medical Details
   */
  async onboardingStep2(req, res, next) {
    try {
      const { user_id, allergies, medical_conditions, medications } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id is required' });
      }

      await dbRun(
        `UPDATE users SET allergies = ?, medical_conditions = ?, medications = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [allergies || 'None', medical_conditions || 'None', medications || 'None', user_id]
      );

      res.status(200).json({
        success: true,
        message: 'Step 2 completed successfully',
        data: {
          user_id,
          allergies: allergies || 'None',
          medical_conditions: medical_conditions || 'None',
          medications: medications || 'None',
          current_step: 2
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Step 3 — Emergency Contact & Complete Onboarding
   */
  async onboardingStep3(req, res, next) {
    try {
      const { user_id, contact_name, relationship, phone_number, preferred_language } = req.body;

      if (!user_id) {
        return res.status(400).json({ success: false, error: 'user_id is required' });
      }

      const selectedLanguage = preferred_language || 'en-IN';

      await dbRun(
        `UPDATE users SET contact_name = ?, relationship = ?, phone_number = ?, 
         preferred_language = ?, onboarding_completed = 1, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [contact_name || 'Emergency Contact', relationship || 'Family', phone_number || '', selectedLanguage, user_id]
      );

      const user = await dbGet('SELECT * FROM users WHERE user_id = ?', [user_id]);

      const uiDictionary = sarvamService.getUIDictionary(selectedLanguage);

      res.status(200).json({
        success: true,
        message: 'User Profile Created successfully',
        data: {
          user,
          ui_dictionary: uiDictionary
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get User Profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.query.user_id || req.headers['x-user-id'];

      let user;
      if (userId) {
        user = await dbGet('SELECT * FROM users WHERE user_id = ?', [userId]);
      } else {
        user = await dbGet('SELECT * FROM users ORDER BY updated_at DESC LIMIT 1');
      }

      if (!user) {
        return res.status(200).json({
          success: true,
          onboarding_completed: false,
          user: null,
          message: 'No user profile found. Please complete onboarding.'
        });
      }

      const uiDictionary = sarvamService.getUIDictionary(user.preferred_language || 'en-IN');

      res.status(200).json({
        success: true,
        onboarding_completed: Boolean(user.onboarding_completed),
        user,
        ui_dictionary: uiDictionary
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Preferred Language
   */
  async updateLanguage(req, res, next) {
    try {
      const { user_id, preferred_language } = req.body;
      const targetLang = preferred_language || 'en-IN';

      if (user_id) {
        await dbRun('UPDATE users SET preferred_language = ? WHERE user_id = ?', [targetLang, user_id]);
      }

      const uiDictionary = sarvamService.getUIDictionary(targetLang);

      res.status(200).json({
        success: true,
        preferred_language: targetLang,
        ui_dictionary: uiDictionary
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log Out & Start Again (Reset Session)
   */
  async resetProfile(req, res, next) {
    try {
      const { user_id } = req.body;

      if (user_id) {
        await dbRun('DELETE FROM users WHERE user_id = ?', [user_id]);
        await dbRun('DELETE FROM sos_requests WHERE user_id = ?', [user_id]);
      } else {
        await dbRun('DELETE FROM users');
        await dbRun('DELETE FROM sos_requests');
      }

      res.status(200).json({
        success: true,
        message: 'Account and profile information cleared. Returning to setup Step 1.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
