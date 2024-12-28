require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importa CORS
const graphRoutes = require('./routes/graph');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // Habilitar solicitudes desde el frontend
app.use(express.json());

// Routes
app.use('/api/graph', graphRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
