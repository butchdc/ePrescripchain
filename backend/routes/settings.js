const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./settings.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to Settings DB.');
  }
});

// Get all setting
router.get('/', (req, res) => {
  db.get('SELECT * FROM settings', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (row) {
      res.json({ value: row.value });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  });
});


// Get a specific setting
router.get('/:key', (req, res) => {
  const key = req.params.key;
  db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (row) {
      res.json({ value: row.value });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  });
});

// Update a setting
router.put('/:key', (req, res) => {
  const key = req.params.key;
  const value = req.body.value;
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: 'Setting updated successfully' });
    }
  });
});

module.exports = router;
