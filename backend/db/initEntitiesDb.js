const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./entities.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS physicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      ipfsHash TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      date INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      ipfsHash TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      date INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pharmacies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      ipfsHash TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      date INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS regulatory_authorities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT UNIQUE NOT NULL,
      ipfsHash TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      date INTEGER NOT NULL
    )
  `);
});

module.exports = db;
