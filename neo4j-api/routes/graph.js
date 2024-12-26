const express = require('express');
const { runQuery } = require('../services/neo4jService');

const router = express.Router();

// Create a node
router.post('/node', async (req, res) => {
    const { label, properties } = req.body;
    const propsString = Object.entries(properties || {})
        .map(([key, value]) => `${key}: $${key}`)
        .join(', ');

    const query = `CREATE (n:${label} { ${propsString} }) RETURN n`;
    try {
        const result = await runQuery(query, properties);
        res.json({ message: 'Node created successfully', result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create node' });
    }
});

// Create a relationship
router.post('/relationship', async (req, res) => {
    const { from, to, type, properties } = req.body;
    const propsString = Object.entries(properties || {})
        .map(([key, value]) => `${key}: $${key}`)
        .join(', ');

    const query = `
        MATCH (a), (b)
        WHERE ID(a) = $from AND ID(b) = $to
        CREATE (a)-[r:${type} { ${propsString} }]->(b)
        RETURN r
    `;
    try {
        const result = await runQuery(query, { ...properties, from, to });
        res.json({ message: 'Relationship created successfully', result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create relationship' });
    }
});

module.exports = router;
