const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Create a connection to the database
const db = new sqlite3.Database('./db/prescriptions.db', (err) => {
  if (err) {
    console.error(`[${getCurrentTimestamp()}] Error opening database:`, err.message);
  } else {
    console.log(`[${getCurrentTimestamp()}] Connected to Prescriptions DB.`);
  }
});

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to fetch data from the prescriptions table with optional conditions and sorting
function fetchPrescriptions(conditions, sort, res) {
  let query = `SELECT * FROM prescriptions`;
  const params = [];

  // Add conditions to query if provided
  if (conditions && Object.keys(conditions).length > 0) {
    query += ' WHERE ' + Object.keys(conditions).map((key, i) => `${key} = ?`).join(' AND ');
    params.push(...Object.values(conditions));
  }

  // Add sorting to query if provided
  if (sort && sort.column && sort.order) {
    query += ` ORDER BY ${sort.column} ${sort.order}`;
  }

  console.log(`[${getCurrentTimestamp()}] Executing query:`, query, 'with params:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching prescriptions:`, err.message);
      res.status(500).json({ error: 'An error occurred while fetching prescriptions.' });
      return;
    }
    if (rows.length === 0) {
      console.log(`[${getCurrentTimestamp()}] No prescriptions found matching the criteria.`);
      res.json({ message: 'No prescriptions found matching the criteria.' });
      return;
    }
    console.log(`[${getCurrentTimestamp()}] Prescriptions fetched successfully:`, rows);
    res.json(rows);
  });
}

// Route to get all prescriptions or filter by conditions with optional sorting
router.get('/', (req, res) => {
  const { createdBy, address, prescriptionID, assignedTo, sortColumn, sortOrder } = req.query;
  const conditions = {};
  const sort = {};

  if (createdBy) conditions.createdBy = createdBy;
  if (address) conditions.address = address;
  if (prescriptionID) conditions.prescriptionID = prescriptionID;
  if (assignedTo) conditions.assignedTo = assignedTo;

  if (sortColumn && sortOrder) {
    sort.column = sortColumn;
    sort.order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  }

  console.log(`[${getCurrentTimestamp()}] GET request received with query parameters:`, req.query);
  fetchPrescriptions(conditions, sort, res);
});

// Route to create or update a prescription
router.post('/', (req, res) => {
  const { address, ipfsHash, createdBy, date, prescriptionID, assignedTo } = req.body;

  console.log(`[${getCurrentTimestamp()}] POST request received with body:`, req.body);

  if (!address || !ipfsHash || !createdBy || !date || !prescriptionID) {
    console.error(`[${getCurrentTimestamp()}] Missing required fields in request body.`);
    return res.status(400).json({ error: 'Address, IPFS hash, createdBy, date, and prescriptionID are required.' });
  }

  const query = `
    INSERT INTO prescriptions (address, ipfsHash, createdBy, date, prescriptionID, assignedTo)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(prescriptionID) DO UPDATE SET
      address=excluded.address,
      ipfsHash=excluded.ipfsHash,
      createdBy=excluded.createdBy,
      date=excluded.date,
      assignedTo=excluded.assignedTo
  `;

  db.run(query, [address, ipfsHash, createdBy, date, prescriptionID, assignedTo || null], function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error inserting/updating prescription:`, err.message);
      res.status(500).json({ error: 'An error occurred while processing the request.' });
      return;
    }
    console.log(`[${getCurrentTimestamp()}] Prescription processed successfully with ID:`, prescriptionID);
    res.status(200).json({ message: 'Prescription processed successfully.' });
  });
});

// Route to delete a prescription by prescriptionID
router.delete('/:prescriptionID', (req, res) => {
  const { prescriptionID } = req.params;

  console.log(`[${getCurrentTimestamp()}] DELETE request received for prescriptionID:`, prescriptionID);

  const query = `DELETE FROM prescriptions WHERE prescriptionID = ?`;

  db.run(query, [prescriptionID], function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error deleting prescription:`, err.message);
      res.status(500).json({ error: 'An error occurred while deleting the prescription.' });
      return;
    }
    if (this.changes === 0) {
      console.log(`[${getCurrentTimestamp()}] Prescription not found for ID:`, prescriptionID);
      return res.status(404).json({ error: 'Prescription not found.' });
    }
    console.log(`[${getCurrentTimestamp()}] Prescription deleted successfully with ID:`, prescriptionID);
    res.status(200).json({ message: 'Prescription deleted successfully.' });
  });
});

module.exports = router;
