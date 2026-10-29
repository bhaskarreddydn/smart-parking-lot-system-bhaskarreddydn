/**
 * HTTP Server Entry Point
 */

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Smart Parking Lot System Backend is running!`);
  console.log(` Server URL : http://localhost:${PORT}`);
  console.log(` API Status : http://localhost:${PORT}/api/v1/parking/status`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});

module.exports = server;
