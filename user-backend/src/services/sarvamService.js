const axios = require('axios');
const { dbGet, dbRun } = require('../config/db');
const localizedPhrases = require('../config/localizedPhrases');

class SarvamService {
  /**
   * Get localized UI dictionary for selected language
   * @param {string} lang e.g. 'hi-IN', 'ta-IN', 'en-IN'
   */
  getUIDictionary(lang = 'en-IN') {
    return localizedPhrases[lang] || localizedPhrases['en-IN'];
  }

  /**
   * Translate text between Indian languages using Sarvam AI API with offline SQLite cache fallback
   * @param {string} text Input text
   * @param {string} sourceLang Source language code (e.g. 'hi-IN')
   * @param {string} targetLang Target language code (e.g. 'en-IN')
   */
  async translateText(text, sourceLang = 'auto', targetLang = 'en-IN') {
    if (!text || text.trim() === '') {
      return { translated_text: text, source: 'empty' };
    }

    // 1. Check local SQLite cache
    try {
      const cached = await dbGet(
        `SELECT translated_text FROM sarvam_cache 
         WHERE source_text = ? AND (source_lang = ? OR source_lang = 'auto') AND target_lang = ?`,
        [text, sourceLang, targetLang]
      );
      if (cached && cached.translated_text) {
        return {
          translated_text: cached.translated_text,
          source: 'sqlite_cache'
        };
      }
    } catch (err) {
      console.warn('⚠️ Sarvam cache lookup warning:', err.message);
    }

    // 2. Live API Call if valid SARVAM_API_KEY is configured
    const apiKey = process.env.SARVAM_API_KEY;
    const apiUrl = process.env.SARVAM_API_URL || 'https://api.sarvam.ai/translate';
    const isPlaceholderKey =
      !apiKey ||
      apiKey === 'your_actual_sarvam_api_key_here' ||
      apiKey.includes('your_actual') ||
      process.env.NODE_ENV === 'test';

    if (!isPlaceholderKey) {
      try {
        const response = await axios.post(
          apiUrl,
          {
            input: text,
            source_language_code: sourceLang === 'auto' ? 'hi-IN' : sourceLang,
            target_language_code: targetLang,
            speaker_gender: 'Female',
            mode: 'formal',
            model: 'mayura:v1'
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'api-subscription-key': apiKey
            },
            timeout: 2500
          }
        );

        if (response.data && response.data.translated_text) {
          const translatedText = response.data.translated_text;

          // Save to SQLite cache asynchronously
          dbRun(
            `INSERT INTO sarvam_cache (source_text, source_lang, target_lang, translated_text)
             VALUES (?, ?, ?, ?)`,
            [text, sourceLang, targetLang, translatedText]
          ).catch((e) => console.warn('Cache save warning:', e.message));

          return {
            translated_text: translatedText,
            source: 'sarvam_api'
          };
        }
      } catch (apiErr) {
        console.warn('⚠️ Sarvam API live call warning (using fallback):', apiErr.message);
      }
    }

    // 3. Fallback: Return original text if offline or API key unconfigured
    return {
      translated_text: text,
      source: 'offline_fallback'
    };
  }
}

module.exports = new SarvamService();
