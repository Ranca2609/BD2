const express = require('express');
const { runQuery } = require('../services/neo4jService');

const router = express.Router();

// Crear una persona
router.post('/node', async (req, res) => {
  const { name, age } = req.body;

  if (!name || age === undefined) {
    return res.status(400).json({ error: 'Name and age are required' });
  }

  const query = `
    CREATE (p:Person { 
      name: $name, 
      age: $age 
    }) 
    RETURN p
  `;

  try {
    const result = await runQuery(query, { name, age });
    res.json({ message: 'Person created successfully', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

// Buscar persona por nombre
router.get('/match', async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Name is required for search' });
  }

  const query = `
    MATCH (p:Person)
    WHERE p.name CONTAINS $name
    RETURN p
  `;

  try {
    const result = await runQuery(query, { name });
    res.json({ result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find person' });
  }
});

// Crear una relación entre dos personas
router.post('/relationship', async (req, res) => {
  const { fromName, toName, type } = req.body;

  if (!fromName || !toName || !type) {
    return res.status(400).json({
      error: 'Source person name, target person name, and relationship type are required',
    });
  }

  const query = `
    MATCH (a:Person), (b:Person)
    WHERE a.name = $fromName AND b.name = $toName
    CREATE (a)-[r:${type}]->(b)
    RETURN r, a, b
  `;

  try {
    const result = await runQuery(query, { fromName, toName });
    res.json({ message: 'Relationship created successfully', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

// Visualizar gráfica mediante la interfaz de Neo4j Browser
router.get('/visualize', async (req, res) => {
  res.json({
    message: 'Access Neo4j Browser here',
    url: 'http://localhost:7474/browser/',
  });
});

module.exports = router;
