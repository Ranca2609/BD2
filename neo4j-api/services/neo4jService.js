const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

const runQuery = async (query, params = {}) => {
    const session = driver.session();
    try {
        const result = await session.run(query, params);
        return result.records.map(record => record.toObject());
    } finally {
        await session.close();
    }
};

module.exports = { runQuery };
