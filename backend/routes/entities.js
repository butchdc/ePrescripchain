const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Create a connection to the database
const db = new sqlite3.Database('./db/entities.db', (err) => {
  if (err) {
    console.error(`[${getCurrentTimestamp()}] Error opening database:`, err.message);
  } else {
    console.log(`[${getCurrentTimestamp()}] Connected to Entities DB.`);
  }
});

// List of valid entities for validation
const validEntities = {
  physicians: ['address', 'ipfsHash', 'createdBy', 'date'],
  patients: ['address', 'ipfsHash', 'createdBy', 'date'],
  pharmacies: ['address', 'pharmacyName', 'pharmacyAddress', 'ipfsHash', 'createdBy', 'date'],
  regulatory_authorities: ['address', 'ipfsHash', 'createdBy', 'date']
};

// Helper function to get current timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Helper function to fetch data from the database
function fetchEntities(tableName, res, conditions = {}) {
  const columns = validEntities[tableName];
  if (!columns) {
    console.error(`[${getCurrentTimestamp()}] Invalid entity type:`, tableName);
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  const query = buildSelectQuery(tableName, conditions);
  const params = Object.values(conditions);

  console.log(`[${getCurrentTimestamp()}] Fetching data from table:`, tableName);
  console.log(`[${getCurrentTimestamp()}] Executing query:`, query, 'with params:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching data from ${tableName}:`, err.message);
      res.status(500).json({ error: 'An error occurred while fetching data.' });
      return;
    }
    console.log(`[${getCurrentTimestamp()}] Data fetched from ${tableName}:`, rows);
    res.json(rows);
  });
}

// Helper function to build SELECT query
function buildSelectQuery(tableName, conditions) {
  let query = `SELECT * FROM ${tableName}`;
  if (Object.keys(conditions).length > 0) {
    query += ' WHERE ' + Object.keys(conditions).map((key) => `${key} LIKE ?`).join(' AND ');
  }
  return query;
}

// Route to get entities with optional query parameters
router.get('/:entity', (req, res) => {
  const { entity } = req.params;
  const queryParams = req.query; // Get query parameters from the request

  console.log(`[${getCurrentTimestamp()}] GET request received for entity:`, entity);
  console.log(`[${getCurrentTimestamp()}] Query parameters:`, queryParams);

  if (!validEntities[entity]) {
    console.error(`[${getCurrentTimestamp()}] Invalid entity type in GET request:`, entity);
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  fetchEntities(entity, res, queryParams);
});

// Route to create or update an entity
router.post('/:entity', (req, res) => {
  const { entity } = req.params;
  const fields = validEntities[entity];

  console.log(`[${getCurrentTimestamp()}] POST request received for entity:`, entity);
  console.log(`[${getCurrentTimestamp()}] Request body:`, req.body);

  if (!fields) {
    console.error(`[${getCurrentTimestamp()}] Invalid entity type in POST request:`, entity);
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  const missingFields = fields.filter(field => req.body[field] === undefined);
  if (missingFields.length > 0) {
    console.error(`[${getCurrentTimestamp()}] Missing required fields in POST request:`, missingFields);
    return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
  }

  const query = buildUpsertQuery(entity, fields);
  const params = fields.map(field => req.body[field]);

  console.log(`[${getCurrentTimestamp()}] Executing UPSERT query for entity:`, entity);
  console.log(`[${getCurrentTimestamp()}] Query:`, query);
  console.log(`[${getCurrentTimestamp()}] Params:`, params);

  db.run(query, params, function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error inserting/updating ${entity}:`, err.message);
      res.status(500).json({ error: 'An error occurred while processing the request.' });
      return;
    }
    console.log(`[${getCurrentTimestamp()}] ${entity.slice(0, -1)} processed successfully.`);
    res.status(200).json({ message: `${entity.slice(0, -1)} processed successfully.` });
  });
});

// Helper function to build UPSERT query
function buildUpsertQuery(entity, fields) {
  const setFields = fields.slice(1).map(field => `${field}=excluded.${field}`).join(', ');
  return `
    INSERT INTO ${entity} (${fields.join(', ')})
    VALUES (${fields.map(() => '?').join(', ')})
    ON CONFLICT(${fields[0]}) DO UPDATE SET
      ${setFields}
  `;
}

// Route to delete an entity by address
router.delete('/:entity/:address', (req, res) => {
  const { entity, address } = req.params;
  console.log(`[${getCurrentTimestamp()}] DELETE request received for entity:`, entity, 'and address:', address);
  if (!validEntities[entity]) {
    console.error(`[${getCurrentTimestamp()}] Invalid entity type in DELETE request:`, entity);
    return res.status(400).json({ error: 'Invalid entity type.' });
  }

  const query = `DELETE FROM ${entity} WHERE address = ?`;

  console.log(`[${getCurrentTimestamp()}] Executing DELETE query for entity:`, entity);
  console.log(`[${getCurrentTimestamp()}] Query:`, query);
  console.log(`[${getCurrentTimestamp()}] Params:`, [address]);

  db.run(query, [address], function (err) {
    if (err) {
      console.error(`[${getCurrentTimestamp()}] Error deleting ${entity}:`, err.message);
      res.status(500).json({ error: 'An error occurred while deleting the entity.' });
      return;
    }
    if (this.changes === 0) {
      console.log(`[${getCurrentTimestamp()}] Entity not found for ${entity} with address:`, address);
      return res.status(404).json({ error: 'Entity not found.' });
    }
    console.log(`[${getCurrentTimestamp()}] ${entity.slice(0, -1)} deleted successfully.`);
    res.status(200).json({ message: `${entity.slice(0, -1)} deleted successfully.` });
  });
});

// Route to get count of entities
router.get('/count/:entity', (req, res) => {
  const { entity } = req.params;
  console.log(`[${getCurrentTimestamp()}] GET request for entity count:`, entity);
  if (!validEntities[entity]) {
    console.error(`[${getCurrentTimestamp()}] Invalid entity type in GET count request:`, entity);
    return res.status(400).json({ error: 'Invalid entity type.' });
  }
  countEntities(entity, res);
});

module.exports = router;
