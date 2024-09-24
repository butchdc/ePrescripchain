const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Create a connection to the database
const db = new sqlite3.Database('./db/settings.db', (err) => {
  if (err) {
    console.error(`[${getCurrentTimestamp()}] Error opening database:`, err.message);
  } else {
    console.log(`[${getCurrentTimestamp()}] Connected to Settings DB.`);
  }
});

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Get a specific setting
router.get('/:key', (req, res) => {
  const key = req.params.key;
  db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error retrieving setting for key ${key}:`, err.message);
      res.status(500).json({ error: err.message });
    } else if (row) {
      // console.log(`[${getCurrentTimestamp()}] Setting retrieved for key ${key}:`, row.value);
      res.json({ value: row.value });
    } else {
      console.warn(`[${getCurrentTimestamp()}] Setting not found for key ${key}`);
      res.status(404).json({ error: 'Setting not found' });
    }
  });
});

// Update a setting
router.put('/:key', (req, res) => {
  const key = req.params.key;
  const value = req.body.value;
  // console.log(`[${getCurrentTimestamp()}] PUT request received for key:`, key, 'with value:', value);
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value], function(err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error updating setting for key ${key}:`, err.message);
      res.status(500).json({ error: err.message });
    } else {
      // console.log(`[${getCurrentTimestamp()}] Setting updated successfully for key ${key}`);
      res.json({ message: 'Setting updated successfully' });
    }
  });
});

module.exports = router;
