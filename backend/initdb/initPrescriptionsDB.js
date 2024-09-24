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

  // Create the status_timestamps table if it does not already exist
  db.run(`
    CREATE TABLE IF NOT EXISTS status_timestamps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescriptionID TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        notes TEXT,
        FOREIGN KEY(prescriptionID) REFERENCES prescriptions(prescriptionID)
    )
  `);
});

db.close();
