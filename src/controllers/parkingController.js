/**
 * Parking Controller
 * Handles HTTP requests for the Smart Parking Lot REST API.
 */

const { defaultParkingLot } = require('../services/ParkingLotService');
const { VehicleType } = require('../models/Vehicle');
const { PaymentMethod } = require('../models/Payment');

class ParkingController {
  constructor(parkingService = defaultParkingLot) {
    this.parkingService = parkingService;
  }

  // GET /api/v1/parking/status
  getStatus = (req, res, next) => {
    try {
      const status = this.parkingService.getSystemStatus();
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/parking/availability
  getAvailability = (req, res, next) => {
    try {
      const status = this.parkingService.getSystemStatus();
      res.status(200).json({
        success: true,
        data: {
          lotName: status.name,
          occupancyRatePercent: status.occupancyRatePercent,
          masterDisplay: status.masterDisplay,
          floors: status.floors.map(f => ({
            floorNumber: f.floorNumber,
            name: f.name,
            display: f.display
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/parking/spots
  getSpots = (req, res, next) => {
    try {
      const { floor, type, occupied } = req.query;
      let spots = this.parkingService.getAllSpots();

      if (floor) {
        spots = spots.filter(s => s.floorNumber === parseInt(floor, 10));
      }
      if (type) {
        spots = spots.filter(s => s.spotType.toUpperCase() === type.toUpperCase());
      }
      if (occupied !== undefined) {
        const isOcc = occupied === 'true';
        spots = spots.filter(s => s.isOccupied === isOcc);
      }

      res.status(200).json({
        success: true,
        count: spots.length,
        data: spots
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/parking/entry
  processEntry = async (req, res, next) => {
    try {
      const { licensePlate, vehicleType, gateId, entryTime } = req.body;

      if (!licensePlate) {
        return res.status(400).json({
          success: false,
          error: 'Vehicle licensePlate is required'
        });
      }

      if (!vehicleType || !Object.values(VehicleType).includes(vehicleType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid vehicleType. Must be one of: ${Object.values(VehicleType).join(', ')}`
        });
      }

      const ticket = await this.parkingService.processEntry(
        licensePlate,
        vehicleType.toUpperCase(),
        gateId || 'GATE-IN-1',
        entryTime ? new Date(entryTime) : new Date()
      );

      res.status(201).json({
        success: true,
        message: 'Vehicle checked in successfully. Parking spot allocated.',
        data: ticket.toJSON()
      });
    } catch (error) {
      if (error.message.includes('FULL') || error.message.includes('No suitable spot')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      if (error.message.includes('already parked')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  };

  // POST /api/v1/parking/exit
  processExit = async (req, res, next) => {
    try {
      const { ticketId, paymentMethod, gateId, exitTime } = req.body;

      if (!ticketId) {
        return res.status(400).json({
          success: false,
          error: 'ticketId is required for check-out'
        });
      }

      const selectedPaymentMethod = paymentMethod
        ? paymentMethod.toUpperCase()
        : PaymentMethod.CARD;

      const result = await this.parkingService.processExit(
        ticketId,
        selectedPaymentMethod,
        gateId || 'GATE-OUT-1',
        exitTime ? new Date(exitTime) : new Date()
      );

      res.status(200).json({
        success: true,
        message: 'Vehicle checked out successfully. Spot vacated and payment settled.',
        data: {
          ticket: result.ticket.toJSON(),
          payment: result.payment.toJSON(),
          feeBreakdown: result.feeDetails
        }
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  };

  // GET /api/v1/parking/tickets/:ticketId
  getTicket = (req, res, next) => {
    try {
      const { ticketId } = req.params;
      const ticket = this.parkingService.getTicket(ticketId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: `Ticket with ID '${ticketId}' was not found`
        });
      }

      res.status(200).json({
        success: true,
        data: ticket.toJSON()
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/parking/configure-strategies
  configureStrategies = (req, res, next) => {
    try {
      const { allocationStrategy, pricingStrategy } = req.body;

      if (allocationStrategy) {
        this.parkingService.setAllocationStrategy(allocationStrategy.toUpperCase());
      }
      if (pricingStrategy) {
        this.parkingService.setPricingStrategy(pricingStrategy.toUpperCase());
      }

      res.status(200).json({
        success: true,
        message: 'System strategies updated successfully',
        data: {
          activeAllocationStrategy: allocationStrategy || 'CURRENT',
          activePricingStrategy: pricingStrategy || 'CURRENT'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/v1/parking/simulate/concurrency
  simulateConcurrency = async (req, res, next) => {
    try {
      const count = parseInt(req.body.count || 10, 10);
      const vehicleType = req.body.vehicleType || VehicleType.CAR;

      const promises = [];
      const startTime = Date.now();

      for (let i = 1; i <= count; i++) {
        const plate = `SIM-${Date.now().toString().slice(-4)}-${i}`;
        const gate = i % 2 === 0 ? 'GATE-IN-2' : 'GATE-IN-1';
        promises.push(
          this.parkingService.processEntry(plate, vehicleType, gate)
            .then(ticket => ({ success: true, plate, spotId: ticket.spotId, ticketId: ticket.ticketId }))
            .catch(err => ({ success: false, plate, error: err.message }))
        );
      }

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success);
      const assignedSpots = successful.map(r => r.spotId);
      const uniqueSpots = new Set(assignedSpots);

      // Verify concurrency guarantee
      const hasDuplicateAllocation = assignedSpots.length !== uniqueSpots.size;

      res.status(200).json({
        success: true,
        executionTimeMs: Date.now() - startTime,
        totalRequests: count,
        successfulAllocations: successful.length,
        failedAllocations: results.length - successful.length,
        hasDuplicateAllocation,
        isConcurrencySafe: !hasDuplicateAllocation,
        results
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  ParkingController,
  defaultParkingController: new ParkingController()
};
