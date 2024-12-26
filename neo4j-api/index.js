require('dotenv').config();
const express = require('express');
const graphRoutes = require('./routes/graph');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/graph', graphRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
