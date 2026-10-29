import { describe, it } from 'node:test';
import assert from 'node:assert';

import { VehicleType, Motorcycle, Car, Bus, ElectricCar } from '../../src/models/Vehicle';
import { ParkingSpot, SpotType } from '../../src/models/ParkingSpot';
import { Floor } from '../../src/models/Floor';
import { Ticket, TicketStatus } from '../../src/models/Ticket';
import { Payment, PaymentMethod } from '../../src/models/Payment';

describe('Domain Models Test Suite (TypeScript)', () => {
  describe('Vehicle Models', () => {
    it('should create valid vehicle instances with normalized uppercase plates', () => {
      const bike = new Motorcycle('ka-01-ab-1234');
      const car = new Car('MH-02-CD-5678');
      const bus = new Bus('DL-01-EF-9999');
      const ev = new ElectricCar('KA-05-EV-0001');

      assert.strictEqual(bike.getLicensePlate(), 'KA-01-AB-1234');
      assert.strictEqual(bike.getType(), VehicleType.MOTORCYCLE);

      assert.strictEqual(car.getLicensePlate(), 'MH-02-CD-5678');
      assert.strictEqual(car.getType(), VehicleType.CAR);

      assert.strictEqual(bus.getType(), VehicleType.BUS);
      assert.strictEqual(ev.getType(), VehicleType.ELECTRIC);
    });

    it('should throw error on missing license plate', () => {
      assert.throws(() => new Car(''), /Valid license plate is required/);
    });
  });

  describe('ParkingSpot Model & Compatibility', () => {
    it('should correctly evaluate vehicle compatibility per spot type', () => {
      const smallSpot = new ParkingSpot('F1-S01', 1, 1, SpotType.SMALL);
      const mediumSpot = new ParkingSpot('F1-S02', 1, 2, SpotType.MEDIUM);
      const largeSpot = new ParkingSpot('F1-S03', 1, 3, SpotType.LARGE);
      const electricSpot = new ParkingSpot('F1-S04', 1, 4, SpotType.ELECTRIC);

      const bike = new Motorcycle('BIKE-1');
      const car = new Car('CAR-1');
      const bus = new Bus('BUS-1');
      const ev = new ElectricCar('EV-1');

      // Motorcycle fits in SMALL, MEDIUM, LARGE
      assert.strictEqual(smallSpot.canFitVehicle(bike), true);
      assert.strictEqual(mediumSpot.canFitVehicle(bike), true);
      assert.strictEqual(largeSpot.canFitVehicle(bike), true);

      // Car fits in MEDIUM, LARGE, but NOT SMALL
      assert.strictEqual(smallSpot.canFitVehicle(car), false);
      assert.strictEqual(mediumSpot.canFitVehicle(car), true);
      assert.strictEqual(largeSpot.canFitVehicle(car), true);

      // Bus fits ONLY in LARGE
      assert.strictEqual(smallSpot.canFitVehicle(bus), false);
      assert.strictEqual(mediumSpot.canFitVehicle(bus), false);
      assert.strictEqual(largeSpot.canFitVehicle(bus), true);

      // Electric car fits in ELECTRIC, MEDIUM, LARGE
      assert.strictEqual(electricSpot.canFitVehicle(ev), true);
      assert.strictEqual(mediumSpot.canFitVehicle(ev), true);
      assert.strictEqual(smallSpot.canFitVehicle(ev), false);
    });

    it('should assign and vacate vehicle properly', () => {
      const spot = new ParkingSpot('F1-S05', 1, 5, SpotType.MEDIUM);
      const car = new Car('CAR-TEST');

      spot.assignVehicle(car);
      assert.strictEqual(spot.isOccupied, true);
      assert.strictEqual(spot.currentVehicle, car);

      assert.throws(() => spot.assignVehicle(car), /already occupied/);

      const vacatedVehicle = spot.vacate();
      assert.strictEqual(vacatedVehicle.getLicensePlate(), 'CAR-TEST');
      assert.strictEqual(spot.isOccupied, false);
      assert.strictEqual(spot.currentVehicle, null);
    });
  });

  describe('Floor & DisplayBoard Observer', () => {
    it('should update display board counts when spots are added and occupied', () => {
      const floor = new Floor(1, 'Ground Floor');
      const s1 = new ParkingSpot('F1-S01', 1, 1, SpotType.SMALL);
      const s2 = new ParkingSpot('F1-S02', 1, 2, SpotType.MEDIUM);

      floor.addSpot(s1);
      floor.addSpot(s2);

      let status = floor.displayBoard.getDisplayStatus();
      assert.strictEqual(status.totalSpots, 2);
      assert.strictEqual(status.freeSpots, 2);
      assert.strictEqual(status.availableByType[SpotType.SMALL], 1);
      assert.strictEqual(status.availableByType[SpotType.MEDIUM], 1);

      s1.assignVehicle(new Motorcycle('M-1'));
      floor.notifyDisplayBoard();

      status = floor.displayBoard.getDisplayStatus();
      assert.strictEqual(status.occupiedSpots, 1);
      assert.strictEqual(status.freeSpots, 1);
      assert.strictEqual(status.availableByType[SpotType.SMALL], 0);
      assert.strictEqual(status.availableByType[SpotType.MEDIUM], 1);
    });
  });

  describe('Ticket & Payment Models', () => {
    it('should generate and complete ticket with payment attachment', () => {
      const car = new Car('KA-01-TICKET');
      const spot = new ParkingSpot('F1-S01', 1, 1, SpotType.MEDIUM);
      const entryTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const ticket = new Ticket('TCK-TEST-001', car, spot, 'GATE-IN-1', entryTime);
      assert.strictEqual(ticket.status, TicketStatus.ACTIVE);

      const exitTime = new Date();
      ticket.closeTicket(exitTime, 40, 'GATE-OUT-1');
      assert.strictEqual(ticket.status, TicketStatus.COMPLETED);
      assert.strictEqual(ticket.fee, 40);
      assert.strictEqual(ticket.durationMinutes >= 119, true);

      const payment = new Payment('PAY-001', ticket.ticketId, 40, PaymentMethod.UPI);
      ticket.attachPayment(payment);
      assert.strictEqual(ticket.payment?.amount, 40);
      assert.strictEqual(ticket.payment?.paymentMethod, 'UPI');
    });
  });
});
