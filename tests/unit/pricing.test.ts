import { describe, it } from 'node:test';
import assert from 'node:assert';

import { HourlyPricingStrategy } from '../../src/strategies/pricing/HourlyPricingStrategy';
import { DynamicPricingStrategy } from '../../src/strategies/pricing/DynamicPricingStrategy';
import { Car, Motorcycle, Bus, ElectricCar } from '../../src/models/Vehicle';
import { ParkingSpot, SpotType } from '../../src/models/ParkingSpot';
import { Ticket } from '../../src/models/Ticket';

describe('Pricing Strategies Test Suite (TypeScript)', () => {
  const dummySpot = new ParkingSpot('F1-S01', 1, 1, SpotType.MEDIUM);

  describe('HourlyPricingStrategy', () => {
    const strategy = new HourlyPricingStrategy();

    it('should charge 0 if vehicle leaves within the 15-minute grace period', () => {
      const car = new Car('CAR-GRACE');
      const now = Date.now();
      const ticket = new Ticket('T-1', car, dummySpot, 'GATE-IN-1', new Date(now - 10 * 60 * 1000));

      const result = strategy.calculateFee(ticket, new Date(now));
      assert.strictEqual(result.totalFee, 0);
      assert.strictEqual(result.billableHours, 0);
    });

    it('should charge 1 hour rate for stay between 16 and 60 minutes', () => {
      const car = new Car('CAR-1HR');
      const now = Date.now();
      const ticket = new Ticket('T-2', car, dummySpot, 'GATE-IN-1', new Date(now - 45 * 60 * 1000));

      const result = strategy.calculateFee(ticket, new Date(now));
      assert.strictEqual(result.billableHours, 1);
      assert.strictEqual(result.totalFee, 20);
    });

    it('should ceil partial hours (e.g. 75 minutes = 2 billable hours)', () => {
      const bike = new Motorcycle('BIKE-2HR');
      const now = Date.now();
      const ticket = new Ticket('T-3', bike, dummySpot, 'GATE-IN-1', new Date(now - 75 * 60 * 1000));

      const result = strategy.calculateFee(ticket, new Date(now));
      assert.strictEqual(result.billableHours, 2);
      assert.strictEqual(result.totalFee, 20);
    });

    it('should calculate correct rates for bus and electric vehicle', () => {
      const now = Date.now();
      const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);

      const busTicket = new Ticket('T-BUS', new Bus('BUS-1'), dummySpot, 'GATE-IN-1', threeHoursAgo);
      const evTicket = new Ticket('T-EV', new ElectricCar('EV-1'), dummySpot, 'GATE-IN-1', threeHoursAgo);

      const busResult = strategy.calculateFee(busTicket, new Date(now));
      const evResult = strategy.calculateFee(evTicket, new Date(now));

      assert.strictEqual(busResult.totalFee, 150);
      assert.strictEqual(evResult.totalFee, 75);
    });
  });

  describe('DynamicPricingStrategy (Surge Multipliers)', () => {
    const dynamicStrategy = new DynamicPricingStrategy();

    it('should apply 1.5x surge when occupancy is 85%', () => {
      const car = new Car('CAR-SURGE-1');
      const now = Date.now();
      const ticket = new Ticket('T-4', car, dummySpot, 'GATE-IN-1', new Date(now - 60 * 60 * 1000));

      const result = dynamicStrategy.calculateFee(ticket, new Date(now), 85);
      assert.strictEqual(result.surgeMultiplier, 1.5);
      assert.strictEqual(result.totalFee, 30);
    });

    it('should apply 2.0x surge when occupancy is 96%', () => {
      const car = new Car('CAR-SURGE-2');
      const now = Date.now();
      const ticket = new Ticket('T-5', car, dummySpot, 'GATE-IN-1', new Date(now - 60 * 60 * 1000));

      const result = dynamicStrategy.calculateFee(ticket, new Date(now), 96);
      assert.strictEqual(result.surgeMultiplier, 2.0);
      assert.strictEqual(result.totalFee, 40);
    });

    it('should keep grace period $0 even during high surge occupancy', () => {
      const car = new Car('CAR-GRACE-SURGE');
      const now = Date.now();
      const ticket = new Ticket('T-6', car, dummySpot, 'GATE-IN-1', new Date(now - 10 * 60 * 1000));

      const result = dynamicStrategy.calculateFee(ticket, new Date(now), 99);
      assert.strictEqual(result.totalFee, 0);
    });
  });
});
