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
const getCurrentTimestamp = () => new Date().toISOString();

// Helper function to build query and parameters
const buildQuery = (conditions, sort) => {
  let query = 'SELECT * FROM prescriptions';
  const params = [];

  // Include conditions only if they are defined and not null
  if (conditions && Object.keys(conditions).length) {
    const validConditions = Object.entries(conditions)
      .filter(([key, value]) => value != null && value !== '') // Filter out undefined, null, and empty strings
      .map(([key]) => `${key} COLLATE NOCASE = ?`); // Add COLLATE NOCASE for case-insensitive comparison

    if (validConditions.length > 0) {
      query += ' WHERE ' + validConditions.join(' AND ');
      params.push(...Object.entries(conditions)
        .filter(([key, value]) => value != null && value !== '')
        .map(([key, value]) => value));
    }
  }

  // Handle sorting if specified
  if (sort && sort.column && sort.order) {
    query += ` ORDER BY ${sort.column} ${sort.order}`;
  }

  return { query, params };
};



// Route to get all prescriptions or filter by conditions with optional sorting
router.get('/', (req, res) => {
  const { createdBy, address, prescriptionID, assignedTo, status, sortColumn, sortOrder } = req.query;
  const conditions = { createdBy, address, prescriptionID, assignedTo, status };
  const sort = {};

  if (sortColumn) {
    sort.column = sortColumn;
    sort.order = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  }

  const { query, params } = buildQuery(conditions, sort);

  console.log(`[${getCurrentTimestamp()}] GET request received with query: ${query}, params: ${params}`);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching prescriptions:`, err.message);
      return res.status(500).json({ error: 'An error occurred while fetching prescriptions.' });
    }
    if (rows.length === 0) {
      return res.json({ message: 'No prescriptions found matching the criteria.' });
    }
    res.json(rows);
  });
});

// Route to create or update a prescription
router.post('/', (req, res) => {
  const { address, ipfsHash, createdBy, date, prescriptionID, assignedTo = null, status = null } = req.body;

  console.log(`[${getCurrentTimestamp()}] POST request received with body:`, req.body);

  if (!address || !ipfsHash || !createdBy || !date || !prescriptionID) {
    return res.status(400).json({ error: 'Address, IPFS hash, createdBy, date, and prescriptionID are required.' });
  }

  const query = `
    INSERT INTO prescriptions (address, ipfsHash, createdBy, date, prescriptionID, assignedTo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(prescriptionID) DO UPDATE SET
      address=excluded.address,
      ipfsHash=excluded.ipfsHash,
      createdBy=excluded.createdBy,
      date=excluded.date,
      assignedTo=excluded.assignedTo,
      status=excluded.status
  `;

  db.run(query, [address, ipfsHash, createdBy, date, prescriptionID, assignedTo, status], function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error inserting/updating prescription:`, err.message);
      return res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
    res.status(200).json({ message: 'Prescription processed successfully.' });
  });
});

// Route to delete a prescription by prescriptionID
router.delete('/:prescriptionID', (req, res) => {
  const { prescriptionID } = req.params;

  console.log(`[${getCurrentTimestamp()}] DELETE request received for prescriptionID: ${prescriptionID}`);

  const query = `DELETE FROM prescriptions WHERE prescriptionID = ?`;

  db.run(query, [prescriptionID], function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error deleting prescription:`, err.message);
      return res.status(500).json({ error: 'An error occurred while deleting the prescription.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }
    res.status(200).json({ message: 'Prescription deleted successfully.' });
  });
});

// Route to get the count of prescriptions with optional filters
router.get('/count', (req, res) => {
  const { physicianID, pharmacyID, patientID } = req.query;

  console.log(`[${getCurrentTimestamp()}] GET request received to count prescriptions with filters:`, req.query);

  // Base query
  let query = 'SELECT COUNT(*) AS count FROM prescriptions';
  const params = [];

  // Build filter conditions
  const conditions = [];
  if (physicianID) {
    conditions.push('createdBy COLLATE NOCASE = ?'); // Add COLLATE NOCASE for case-insensitive comparison
    params.push(physicianID);
  }
  if (pharmacyID) {
    conditions.push('assignedTo COLLATE NOCASE = ?'); // Add COLLATE NOCASE for case-insensitive comparison
    params.push(pharmacyID);
  }
  if (patientID) {
    conditions.push('address COLLATE NOCASE = ?'); // Add COLLATE NOCASE for case-insensitive comparison
    params.push(patientID);
  }

  // Append conditions to the query
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  console.log(`[${getCurrentTimestamp()}] Executing query: ${query}, params: ${params}`);

  db.get(query, params, (err, row) => {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error counting prescriptions:`, err.message);
      return res.status(500).json({ error: 'An error occurred while counting prescriptions.' });
    }
    res.json({ count: row.count });
  });
});



// Route to add a status timestamp
router.post('/status-timestamps', (req, res) => {
  const { prescriptionID, status, timestamp, notes } = req.body;

  console.log(`[${getCurrentTimestamp()}] POST request received for status-timestamps with body:`, req.body);

  if (!prescriptionID || !status || !timestamp) {
    return res.status(400).json({ error: 'PrescriptionID, status, and timestamp are required.' });
  }

  const query = `
    INSERT INTO status_timestamps (prescriptionID, status, timestamp, notes)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [prescriptionID, status, timestamp, notes || null], function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error inserting status timestamp:`, err.message);
      return res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
    res.status(200).json({ message: 'Status timestamp added successfully.' });
  });
});

// Route to get status timestamps for a prescription with optional sorting
router.get('/status-timestamps/:prescriptionID', (req, res) => {
  const { prescriptionID } = req.params;
  const { sortColumn, sortOrder } = req.query;

  console.log(`[${getCurrentTimestamp()}] GET request received for status-timestamps of prescriptionID: ${prescriptionID}`);

  // Default sorting by timestamp if not provided
  const sort = {
    column: sortColumn || 'timestamp',
    order: ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC'
  };

  const query = `SELECT * FROM status_timestamps WHERE prescriptionID = ? ORDER BY ${sort.column} ${sort.order}`;

  db.all(query, [prescriptionID], (err, rows) => {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching status timestamps:`, err.message);
      return res.status(500).json({ error: 'An error occurred while fetching status timestamps.' });
    }
    if (rows.length === 0) {
      return res.json({ message: 'No status timestamps found for this prescription.' });
    }
    res.json(rows);
  });
});



module.exports = router;
