/**
 * ParkingLotService (Singleton / Facade Pattern)
 * Core orchestrator for the smart parking lot backend system.
 */

const { randomUUID } = require('crypto');
const { Floor } = require('../models/Floor');
const { SpotType } = require('../models/ParkingSpot');
const { EntryGate, ExitGate } = require('../models/Gate');
const { Ticket, TicketStatus } = require('../models/Ticket');
const { Payment, PaymentMethod } = require('../models/Payment');
const { DisplayBoard } = require('../models/DisplayBoard');
const { SpotFactory } = require('../factories/SpotFactory');
const { VehicleFactory } = require('../factories/VehicleFactory');
const { AllocationService, NearestSpotStrategy, BestFitStrategy } = require('./AllocationService');
const { FeeCalculationService, DynamicPricingStrategy, HourlyPricingStrategy } = require('./FeeCalculationService');
const { ConcurrencyManager } = require('./ConcurrencyManager');

class ParkingLotService {
  /**
   * @param {string} name
   * @param {number} numFloors
   * @param {number} spotsPerFloor
   */
  constructor(name = 'Metropolis Smart Parking', numFloors = 3, spotsPerFloor = 20) {
    this.name = name;
    this.floors = [];
    this.entryGates = new Map();
    this.exitGates = new Map();
    this.activeTickets = new Map();      // ticketId -> Ticket
    this.completedTickets = new Map();   // ticketId -> Ticket
    this.vehicleTicketIndex = new Map(); // licensePlate -> ticketId
    this.mainDisplayBoard = new DisplayBoard('DISPLAY-MAIN');

    this.concurrencyManager = new ConcurrencyManager();
    this.allocationService = new AllocationService(new NearestSpotStrategy());
    this.feeCalculationService = new FeeCalculationService(new DynamicPricingStrategy());

    this._initializeParkingLot(numFloors, spotsPerFloor);
  }

  /**
   * Initializes floors, spots, and default gates
   * @private
   */
  _initializeParkingLot(numFloors, spotsPerFloor) {
    for (let f = 1; f <= numFloors; f++) {
      const floor = new Floor(f, `Level ${f}`);

      // Typical spot distribution per floor:
      // 20% SMALL (motorcycles), 55% MEDIUM (cars), 15% LARGE (buses/trucks), 10% ELECTRIC
      const smallCount = Math.max(1, Math.round(spotsPerFloor * 0.20));
      const mediumCount = Math.max(1, Math.round(spotsPerFloor * 0.55));
      const largeCount = Math.max(1, Math.round(spotsPerFloor * 0.15));
      const electricCount = spotsPerFloor - (smallCount + mediumCount + largeCount);

      let spotIndex = 1;

      // Create SMALL spots
      for (let i = 0; i < smallCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.SMALL));
      }
      // Create MEDIUM spots
      for (let i = 0; i < mediumCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.MEDIUM));
      }
      // Create LARGE spots
      for (let i = 0; i < largeCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.LARGE));
      }
      // Create ELECTRIC spots
      for (let i = 0; i < electricCount; i++) {
        floor.addSpot(SpotFactory.createSpot(f, spotIndex++, SpotType.ELECTRIC));
      }

      this.floors.push(floor);
    }

    // Default Entry and Exit Gates
    this.addEntryGate('GATE-IN-1', 'North Entrance Gate');
    this.addEntryGate('GATE-IN-2', 'South Entrance Gate');
    this.addExitGate('GATE-OUT-1', 'East Exit Gate');
    this.addExitGate('GATE-OUT-2', 'West Exit Gate');

    this._updateMainDisplay();
  }

  addEntryGate(id, name) {
    this.entryGates.set(id, new EntryGate(id, name));
  }

  addExitGate(id, name) {
    this.exitGates.set(id, new ExitGate(id, name));
  }

  /**
   * Updates master display board
   * @private
   */
  _updateMainDisplay() {
    const allSpots = this.floors.flatMap(f => f.getAllSpots());
    this.mainDisplayBoard.update(allSpots);
  }

  /**
   * Returns current lot-wide occupancy percentage (0 - 100)
   */
  getOccupancyRate() {
    const total = this.mainDisplayBoard.totalSpots;
    const occupied = this.mainDisplayBoard.occupiedSpots;
    if (total === 0) return 0;
    return Math.round((occupied / total) * 100);
  }

  /**
   * Vehicle Entry Handler (Thread-safe concurrency locked)
   * @param {string} licensePlate
   * @param {string} vehicleType
   * @param {string} gateId
   * @param {Date} entryTime
   * @returns {Promise<Ticket>}
   */
  async processEntry(licensePlate, vehicleType, gateId = 'GATE-IN-1', entryTime = new Date()) {
    // Acquire lock to avoid race conditions when assigning spots concurrently
    return this.concurrencyManager.withAllocationLock(async () => {
      const normalizedPlate = (licensePlate || '').trim().toUpperCase();

      if (!normalizedPlate) {
        throw new Error('Vehicle license plate is required');
      }

      if (this.vehicleTicketIndex.has(normalizedPlate)) {
        const existingTicketId = this.vehicleTicketIndex.get(normalizedPlate);
        throw new Error(`Vehicle ${normalizedPlate} is already parked with active Ticket ID: ${existingTicketId}`);
      }

      const vehicle = VehicleFactory.createVehicle(normalizedPlate, vehicleType);
      const allocatedSpot = this.allocationService.allocateSpot(this.floors, vehicle);

      const ticketId = `TCK-${Date.now()}-${randomUUID().substring(0, 6).toUpperCase()}`;
      const ticket = new Ticket(ticketId, vehicle, allocatedSpot, gateId, entryTime);

      this.activeTickets.set(ticketId, ticket);
      this.vehicleTicketIndex.set(normalizedPlate, ticketId);

      this._updateMainDisplay();

      // Gate action simulation
      const gate = this.entryGates.get(gateId);
      if (gate) {
        gate.openBarrier();
        setTimeout(() => gate.closeBarrier(), 100);
      }

      return ticket;
    });
  }

  /**
   * Vehicle Exit Handler
   * @param {string} ticketId
   * @param {string} paymentMethod
   * @param {string} gateId
   * @param {Date} exitTimeOverride
   * @returns {Promise<{ ticket: Ticket, payment: Payment, feeDetails: object }>}
   */
  async processExit(ticketId, paymentMethod = PaymentMethod.CARD, gateId = 'GATE-OUT-1', exitTimeOverride = null) {
    if (!ticketId || !this.activeTickets.has(ticketId)) {
      throw new Error(`Active ticket with ID '${ticketId}' was not found`);
    }

    const ticket = this.activeTickets.get(ticketId);
    const exitTime = exitTimeOverride ? new Date(exitTimeOverride) : new Date();

    // Calculate fee
    const occupancyPercent = this.getOccupancyRate();
    const feeCalculation = this.feeCalculationService.calculate(ticket, exitTime, occupancyPercent);

    // Process payment
    const paymentId = `PAY-${Date.now()}-${randomUUID().substring(0, 6).toUpperCase()}`;
    const payment = new Payment(paymentId, ticketId, feeCalculation.totalFee, paymentMethod, exitTime);

    // Concurrently safe spot release
    await this.concurrencyManager.withSpotLock(ticket.spotId, async () => {
      this.allocationService.releaseSpot(this.floors, ticket.spotId);
    });

    ticket.attachPayment(payment);
    ticket.closeTicket(exitTime, feeCalculation.totalFee, gateId);

    // Move from active to completed index
    this.activeTickets.delete(ticketId);
    this.vehicleTicketIndex.delete(ticket.licensePlate);
    this.completedTickets.set(ticketId, ticket);

    this._updateMainDisplay();

    // Gate action simulation
    const gate = this.exitGates.get(gateId);
    if (gate) {
      gate.openBarrier();
      setTimeout(() => gate.closeBarrier(), 100);
    }

    return {
      ticket,
      payment,
      feeDetails: feeCalculation
    };
  }

  /**
   * Retrieves real-time parking lot status
   */
  getSystemStatus() {
    this._updateMainDisplay();
    return {
      name: this.name,
      occupancyRatePercent: this.getOccupancyRate(),
      masterDisplay: this.mainDisplayBoard.getDisplayStatus(),
      activeVehiclesCount: this.activeTickets.size,
      totalCompletedTransactions: this.completedTickets.size,
      floors: this.floors.map(floor => floor.getFloorStatus()),
      gates: {
        entryGates: Array.from(this.entryGates.values()).map(g => ({ id: g.id, name: g.name, type: g.type })),
        exitGates: Array.from(this.exitGates.values()).map(g => ({ id: g.id, name: g.name, type: g.type }))
      }
    };
  }

  /**
   * Retrieves all parking spots across all floors
   */
  getAllSpots() {
    return this.floors.flatMap(floor => floor.getAllSpots().map(s => s.toJSON()));
  }

  /**
   * Looks up a ticket by ID
   * @param {string} ticketId
   * @returns {Ticket|null}
   */
  getTicket(ticketId) {
    if (this.activeTickets.has(ticketId)) {
      return this.activeTickets.get(ticketId);
    }
    if (this.completedTickets.has(ticketId)) {
      return this.completedTickets.get(ticketId);
    }
    return null;
  }

  /**
   * Changes spot allocation strategy on the fly
   * @param {'NEAREST'|'BEST_FIT'} strategyName
   */
  setAllocationStrategy(strategyName) {
    if (strategyName === 'BEST_FIT') {
      this.allocationService.setStrategy(new BestFitStrategy());
    } else {
      this.allocationService.setStrategy(new NearestSpotStrategy());
    }
  }

  /**
   * Changes pricing strategy on the fly
   * @param {'HOURLY'|'DYNAMIC'} strategyName
   */
  setPricingStrategy(strategyName) {
    if (strategyName === 'HOURLY') {
      this.feeCalculationService.setStrategy(new HourlyPricingStrategy());
    } else {
      this.feeCalculationService.setStrategy(new DynamicPricingStrategy());
    }
  }
}

// Export singleton instance as well as the class
const defaultParkingLot = new ParkingLotService();

module.exports = {
  ParkingLotService,
  defaultParkingLot
};
