const sarvamService = require('../services/sarvamService');

class SarvamController {
  /**
   * Get full UI dictionary for selected language
   */
  async getDictionary(req, res, next) {
    try {
      const lang = req.query.lang || req.query.language || 'en-IN';
      const uiDictionary = sarvamService.getUIDictionary(lang);

      res.status(200).json({
        success: true,
        language: lang,
        ui_dictionary: uiDictionary
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Live Translate text between regional Indian languages and English via Sarvam AI API
   */
  async translate(req, res, next) {
    try {
      const { text, source_lang, target_lang } = req.body;

      if (!text) {
        return res.status(400).json({ success: false, error: 'text field is required for translation' });
      }

      const result = await sarvamService.translateText(
        text,
        source_lang || 'auto',
        target_lang || 'en-IN'
      );

      res.status(200).json({
        success: true,
        original_text: text,
        translated_text: result.translated_text,
        source: result.source
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SarvamController();
