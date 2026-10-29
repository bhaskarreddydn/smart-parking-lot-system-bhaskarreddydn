/**
 * Parking Routes
 * Defines API endpoints for vehicle entry, exit, spot discovery, and status.
 */

const express = require('express');
const { defaultParkingController } = require('../controllers/parkingController');

const router = express.Router();

// System Status and Availability
router.get('/status', defaultParkingController.getStatus);
router.get('/availability', defaultParkingController.getAvailability);

// Spot Discovery
router.get('/spots', defaultParkingController.getSpots);

// Check-in (Vehicle Entry)
router.post('/entry', defaultParkingController.processEntry);

// Check-out (Vehicle Exit)
router.post('/exit', defaultParkingController.processExit);

// Ticket details
router.get('/tickets/:ticketId', defaultParkingController.getTicket);

// Strategy Configuration
router.post('/configure-strategies', defaultParkingController.configureStrategies);

// Concurrency Simulation Endpoint
router.post('/simulate/concurrency', defaultParkingController.simulateConcurrency);

module.exports = router;
