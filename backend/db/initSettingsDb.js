const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./settings.db');

db.serialize(() => {
  // Create the settings table if it does not exist
  db.run(
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`
    )
  });

// Export the db object for use in other modules
module.exports = db;
