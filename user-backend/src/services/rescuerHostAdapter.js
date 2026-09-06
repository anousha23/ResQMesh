const axios = require('axios');

class RescuerHostAdapter {
  /**
   * Forward canonical civilian SOS payload to the Rescuer Host backend POST /events endpoint
   * @param {Object} sosData SOS record from SQLite
   * @param {Object} userProfile Full user profile and medical details
   */
  async forwardSOSEvent(sosData, userProfile = {}) {
    const rescuerHostUrl =
      process.env.RESCUER_HOST_URL || 'http://localhost:8000/events';

    const canonicalEvent = {
      device_id: `CIV_${userProfile.user_id || 'UNKNOWN'}`,
      source_type: 'CIVILIAN',
      timestamp: sosData.created_at || new Date().toISOString(),
      location: {
        lat: sosData.latitude || 0,
        lon: sosData.longitude || 0
      },
      observation: {
        modality: 'SOS',
        emergency_type: sosData.emergency_type || 'OTHER',
        text: sosData.description || 'Emergency SOS',
        translated_text: sosData.translated_description || sosData.description,
        user_profile: {
          full_name: userProfile.full_name || 'Anonymous Civilian',
          age: userProfile.age || null,
          blood_group: userProfile.blood_group || 'Unknown',
          allergies: userProfile.allergies || 'None',
          medical_conditions: userProfile.medical_conditions || 'None',
          medications: userProfile.medications || 'None',
          emergency_contact: {
            name: userProfile.contact_name || 'None',
            relationship: userProfile.relationship || 'None',
            phone: userProfile.phone_number || 'None'
          }
        }
      }
    };

    try {
      const response = await axios.post(rescuerHostUrl, canonicalEvent, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 4000
      });

      return {
        transmitted: true,
        status: 'SENT',
        host_response: response.data
      };
    } catch (err) {
      console.warn(
        `⚠️ Rescuer Host backend unreachable at ${rescuerHostUrl} (${err.message}). Queueing local status as TRANSMITTING.`
      );

      return {
        transmitted: false,
        status: 'TRANSMITTING',
        error: err.message
      };
    }
  }
}

module.exports = new RescuerHostAdapter();
