const { createClient } = require('@libsql/client');
require('dotenv').config();

let db = null;

async function initializeTurso() {
  const apiToken = process.env.TURSO_API_TOKEN;
  const dbUrl = process.env.TURSO_DB_URL;

  if (!apiToken || !dbUrl) {
    console.error('Missing TURSO_API_TOKEN or TURSO_DB_URL environment variables');
    return false;
  }

  try {
    db = createClient({
      url: dbUrl,
      authToken: apiToken,
    });

    // Test connection and create table if needed
    await db.execute(`
      CREATE TABLE IF NOT EXISTS newsletter_subs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Connected to Turso database');
    return true;
  } catch (err) {
    console.error('Error connecting to Turso:', err.message);
    return false;
  }
}

function getDb() {
  return db;
}

module.exports = {
  initializeTurso,
  getDb,
};
