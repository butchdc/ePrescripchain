// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const db = new sqlite3.Database('./settings.db');

app.use(express.json());
app.use(cors());

// Initialize database
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL)');
});

// Get a specific setting
app.get('/api/settings/:key', (req, res) => {
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
app.put('/api/settings/:key', (req, res) => {
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

app.listen(3001, () => {
  console.log('Backend server running on port 3001');
});
