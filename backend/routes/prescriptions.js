const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Create a connection to the database
const db = new sqlite3.Database('./db/entities.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to Prescriptions DB.');
  }
});

// Helper function to fetch data from the prescriptions table with optional conditions
function fetchPrescriptions(conditions, res) {
  let query = `SELECT * FROM prescriptions`;
  const params = [];

  if (conditions && Object.keys(conditions).length > 0) {
    query += ' WHERE ' + Object.keys(conditions).map((key, i) => `${key} = ?`).join(' AND ');
    params.push(...Object.values(conditions));
  }

  console.log('Executing query:', query, 'with params:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching prescriptions:', err.message);
      res.status(500).json({ error: 'An error occurred while fetching prescriptions.' });
      return;
    }
    if (rows.length === 0) {
      res.status(404).json({ message: 'No prescriptions found matching the criteria.' });
      return;
    }
    res.json(rows);
  });
}

// Route to get all prescriptions or filter by conditions
router.get('/', (req, res) => {
  const { createdBy, address, prescriptionID } = req.query;
  const conditions = {};

  if (createdBy) conditions.createdBy = createdBy;
  if (address) conditions.address = address;
  if (prescriptionID) conditions.prescriptionID = prescriptionID;

  fetchPrescriptions(conditions, res);
});

// Route to create or update a prescription
router.post('/', (req, res) => {
  const { address, ipfsHash, createdBy, date, prescriptionID } = req.body;

  if (!address || !ipfsHash || !createdBy || !date || !prescriptionID) {
    return res.status(400).json({ error: 'Address, IPFS hash, createdBy, date, and prescriptionID are required.' });
  }

  const query = `
    INSERT INTO prescriptions (address, ipfsHash, createdBy, date, prescriptionID)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(prescriptionID) DO UPDATE SET
      address=excluded.address,
      ipfsHash=excluded.ipfsHash,
      createdBy=excluded.createdBy,
      date=excluded.date
  `;

  db.run(query, [address, ipfsHash, createdBy, date, prescriptionID], function (err) {
    if (err) {
      console.error('Error inserting/updating prescription:', err.message);
      res.status(500).json({ error: 'An error occurred while processing the request.' });
      return;
    }
    res.status(200).json({ message: 'Prescription processed successfully.' });
  });
});

// Route to delete a prescription by prescriptionID
router.delete('/:prescriptionID', (req, res) => {
  const { prescriptionID } = req.params;

  const query = `DELETE FROM prescriptions WHERE prescriptionID = ?`;

  db.run(query, [prescriptionID], function (err) {
    if (err) {
      console.error('Error deleting prescription:', err.message);
      res.status(500).json({ error: 'An error occurred while deleting the prescription.' });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }
    res.status(200).json({ message: 'Prescription deleted successfully.' });
  });
});

module.exports = router;
