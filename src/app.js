/**
 * Express Application Setup
 */

const express = require('express');
const parkingRoutes = require('./routes/parkingRoutes');

const app = express();

app.use(express.json());

// API Root info
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Smart Parking Lot Backend API',
    version: '1.0.0',
    documentation: '/api/v1/parking/status',
    endpoints: {
      status: 'GET /api/v1/parking/status',
      availability: 'GET /api/v1/parking/availability',
      spots: 'GET /api/v1/parking/spots',
      entry: 'POST /api/v1/parking/entry',
      exit: 'POST /api/v1/parking/exit',
      ticket: 'GET /api/v1/parking/tickets/:ticketId',
      concurrencySimulation: 'POST /api/v1/parking/simulate/concurrency',
      strategies: 'POST /api/v1/parking/configure-strategies'
    }
  });
});

// API v1 routes
app.use('/api/v1/parking', parkingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
