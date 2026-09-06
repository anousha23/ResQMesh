const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const localizedPhrases = require('./localizedPhrases');

const dbPath = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.join(__dirname, '../../resqmesh_user.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`✅ SQLite Database connected at: ${dbPath}`);
  }
});

function initDatabase() {
  db.serialize(() => {
    // 1. Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        full_name TEXT,
        age INTEGER,
        blood_group TEXT,
        profile_photo TEXT,
        allergies TEXT,
        medical_conditions TEXT,
        medications TEXT,
        contact_name TEXT,
        relationship TEXT,
        phone_number TEXT,
        preferred_language TEXT DEFAULT 'en-IN',
        onboarding_completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Sarvam Translation Cache table
    db.run(`
      CREATE TABLE IF NOT EXISTS sarvam_cache (
        cache_id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_text TEXT,
        source_lang TEXT,
        target_lang TEXT,
        translated_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. SOS Requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS sos_requests (
        sos_id TEXT PRIMARY KEY,
        user_id TEXT,
        emergency_type TEXT,
        description TEXT,
        translated_description TEXT,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'CREATED',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
      )
    `);

    // Seed pre-cached phrases into sarvam_cache
    const stmt = db.prepare(`
      INSERT INTO sarvam_cache (source_text, source_lang, target_lang, translated_text)
      VALUES (?, ?, ?, ?)
    `);

    const defaultPhrases = localizedPhrases['en-IN'];
    for (const [lang, phrases] of Object.entries(localizedPhrases)) {
      if (lang === 'en-IN') continue;
      for (const [key, text] of Object.entries(phrases)) {
        const sourceText = defaultPhrases[key] || key;
        stmt.run(sourceText, 'en-IN', lang, text);
      }
    }
    stmt.finalize();
  });
}

// Promisified DB helpers
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

initDatabase();

module.exports = {
  db,
  dbRun,
  dbGet,
  dbAll
};
