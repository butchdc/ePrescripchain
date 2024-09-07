// routes/entities.js

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Create a connection to the database
const db = new sqlite3.Database('./db/entities.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to Entities DB.');
  }
});

// List of valid entities for validation
const validEntities = ['physicians', 'patients', 'pharmacies', 'regulatory_authorities', 'prescriptions'];

// Helper function to fetch data from the database
function fetchEntities(tableName, res, conditions = {}) {
  if (!validEntities.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  let query = `SELECT * FROM ${tableName}`;
  const params = [];

  if (Object.keys(conditions).length > 0) {
    query += ' WHERE ' + Object.keys(conditions).map((key, i) => `${key} = ?`).join(' AND ');
    params.push(...Object.values(conditions));
  }

  console.log('Executing query:', query, 'with params:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(`Error fetching data from ${tableName}:`, err.message);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
      return;
    }
    res.json(rows);
  });
}

// Helper function to count records in the database
function countEntities(tableName, res) {
  if (!validEntities.includes(tableName)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  const query = `SELECT COUNT(*) AS count FROM ${tableName}`;

  db.get(query, [], (err, row) => {
    if (err) {
      console.error(`Error counting data from ${tableName}:`, err.message);
      res.status(500).json({ error: 'An error occurred while counting data.' });
      return;
    }
    res.json({ count: row.count });
  });
}

// Route to get all entities
router.get('/:entity', (req, res) => {
  const { entity } = req.params;
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }
  fetchEntities(entity, res);
});

// Route to create or update an entity
router.post('/:entity', (req, res) => {
  const { entity } = req.params;
  const { address, ipfsHash, createdBy, date } = req.body;

  if (!validEntities.includes(entity)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  if (!address || !ipfsHash || !createdBy || !date) {
    return res.status(400).json({ error: 'Address, IPFS hash, createdBy, and date are required.' });
  }

  const query = `
    INSERT INTO ${entity} (address, ipfsHash, createdBy, date)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET
      ipfsHash=excluded.ipfsHash,
      createdBy=excluded.createdBy,
      date=excluded.date
  `;

  db.run(query, [address, ipfsHash, createdBy, date], function (err) {
    if (err) {
      console.error(`Error inserting/updating ${entity}:`, err.message);
      res.status(500).json({ error: 'An error occurred while processing the request.' });
      return;
    }
    res.status(200).json({ message: `${entity.slice(0, -1)} processed successfully.` });
  });
});

// Route to delete an entity by address
router.delete('/:entity/:address', (req, res) => {
  const { entity, address } = req.params;
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  const query = `DELETE FROM ${entity} WHERE address = ?`;

  db.run(query, [address], function (err) {
    if (err) {
      console.error(`Error deleting ${entity}:`, err.message);
      res.status(500).json({ error: 'An error occurred while deleting the entity.' });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Entity not found.' });
    }
    res.status(200).json({ message: `${entity.slice(0, -1)} deleted successfully.` });
  });
});

// Route to get count of entities
router.get('/count/:entity', (req, res) => {
  const { entity } = req.params;
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }
  countEntities(entity, res);
});

module.exports = router;
