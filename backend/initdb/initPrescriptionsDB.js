const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/prescriptions.db');

db.serialize(() => {
  // Create the prescriptions table if it does not already exist
  db.run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
        prescriptionID TEXT PRIMARY KEY,
        address TEXT NOT NULL,
        ipfsHash TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        date INTEGER NOT NULL,
        assignedTo TEXT,
        status TEXT
    )
  `);
});