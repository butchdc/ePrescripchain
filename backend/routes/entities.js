const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Create a connection to the database
const db = new sqlite3.Database('./entities.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to Entities DB.');
  }
});

// Helper function to fetch data from the database
function fetchEntities(tableName, res) {
  const query = `SELECT * FROM ${tableName}`;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(`Error fetching data from ${tableName}:`, err.message);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
      return;
    }
    res.json(rows);
  });
}

// Route to get all entities
router.get('/:entity', (req, res) => {
  const { entity } = req.params;
  const validEntities = ['physicians', 'patients', 'pharmacies', 'regulatory_authorities'];
  
  if (!validEntities.includes(entity)) {
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  fetchEntities(entity, res);
});

// Route to create or update an entity
router.post('/:entity', (req, res) => {
  const { entity } = req.params;
  const { address, ipfsHash, createdBy, date } = req.body;

  const validEntities = ['physicians', 'patients', 'pharmacies', 'regulatory_authorities'];
  
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
  const validEntities = ['physicians', 'patients', 'pharmacies', 'regulatory_authorities'];
  
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

module.exports = router;
