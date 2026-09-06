const { v4: uuidv4 } = require('uuid');
const { dbGet, dbRun, dbAll } = require('../config/db');
const sarvamService = require('../services/sarvamService');
const rescuerHostAdapter = require('../services/rescuerHostAdapter');

class SOSController {
  /**
   * Create & Trigger Emergency SOS
   */
  async createSOS(req, res, next) {
    try {
      const { user_id, emergency_type, description, latitude, longitude } = req.body;

      let userId = user_id;
      let userProfile = null;

      if (userId) {
        userProfile = await dbGet('SELECT * FROM users WHERE user_id = ?', [userId]);
      }

      if (!userProfile) {
        // Fetch latest active user if user_id not provided
        userProfile = await dbGet('SELECT * FROM users ORDER BY updated_at DESC LIMIT 1');
        if (userProfile) {
          userId = userProfile.user_id;
        }
      }

      const sosId = `SOS_${uuidv4().slice(0, 8).toUpperCase()}`;
      const emergencyCategory = emergency_type || 'MEDICAL';
      const rawDescription = description || 'Emergency SOS Help Needed';

      // Translate regional description to English via Sarvam AI
      const userLang = userProfile ? userProfile.preferred_language : 'hi-IN';
      const translationResult = await sarvamService.translateText(
        rawDescription,
        userLang,
        'en-IN'
      );

      const translatedDesc = translationResult.translated_text;

      const lat = parseFloat(latitude) || 28.6139;
      const lon = parseFloat(longitude) || 77.2090;

      // 1. Insert into SQLite with CREATED status
      await dbRun(
        `INSERT INTO sos_requests 
         (sos_id, user_id, emergency_type, description, translated_description, latitude, longitude, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'CREATED')`,
        [sosId, userId || 'ANONYMOUS', emergencyCategory, rawDescription, translatedDesc, lat, lon]
      );

      const sosRecord = await dbGet('SELECT * FROM sos_requests WHERE sos_id = ?', [sosId]);

      // 2. Forward canonical SOS event to Rescuer Host backend
      const dispatchResult = await rescuerHostAdapter.forwardSOSEvent(sosRecord, userProfile || {});

      // 3. Update local status
      const finalStatus = dispatchResult.status || 'SENT';
      await dbRun('UPDATE sos_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE sos_id = ?', [
        finalStatus,
        sosId
      ]);

      res.status(201).json({
        success: true,
        message: 'Your emergency request has been transmitted.',
        sos_id: sosId,
        status: finalStatus,
        sos_record: {
          ...sosRecord,
          status: finalStatus
        },
        transmission_info: dispatchResult
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Active SOS Status Lifecycle
   */
  async getSOSStatus(req, res, next) {
    try {
      const sosId = req.query.sos_id;
      const userId = req.query.user_id;

      let sosRecord;
      if (sosId) {
        sosRecord = await dbGet('SELECT * FROM sos_requests WHERE sos_id = ?', [sosId]);
      } else if (userId) {
        sosRecord = await dbGet(
          'SELECT * FROM sos_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
          [userId]
        );
      } else {
        sosRecord = await dbGet('SELECT * FROM sos_requests ORDER BY created_at DESC LIMIT 1');
      }

      if (!sosRecord) {
        return res.status(200).json({
          success: true,
          has_active_sos: false,
          sos: null,
          message: 'No active SOS request found.'
        });
      }

      const statusStages = [
        'CREATED',
        'TRANSMITTING',
        'SENT',
        'RECEIVED',
        'HELP_DISPATCHED',
        'RESOLVED'
      ];

      res.status(200).json({
        success: true,
        has_active_sos: sosRecord.status !== 'RESOLVED',
        sos: sosRecord,
        status_lifecycle: {
          current_status: sosRecord.status,
          stages: statusStages,
          stage_index: statusStages.indexOf(sosRecord.status)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel / Resolve SOS Request
   */
  async cancelSOS(req, res, next) {
    try {
      const sosId = req.params.id || req.body.sos_id;

      if (!sosId) {
        return res.status(400).json({ success: false, error: 'sos_id is required' });
      }

      await dbRun(
        `UPDATE sos_requests SET status = 'RESOLVED', updated_at = CURRENT_TIMESTAMP WHERE sos_id = ?`,
        [sosId]
      );

      res.status(200).json({
        success: true,
        sos_id: sosId,
        status: 'RESOLVED',
        message: 'SOS request cancelled/resolved successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SOSController();
