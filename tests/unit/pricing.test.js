const { describe, it } = require('node:test');
const assert = require('node:assert');

const { HourlyPricingStrategy } = require('../../src/strategies/pricing/HourlyPricingStrategy');
const { DynamicPricingStrategy } = require('../../src/strategies/pricing/DynamicPricingStrategy');
const { Car, Motorcycle, Bus, ElectricCar } = require('../../src/models/Vehicle');
const { ParkingSpot, SpotType } = require('../../src/models/ParkingSpot');
const { Ticket } = require('../../src/models/Ticket');

describe('Pricing Strategies Test Suite', () => {
  const dummySpot = new ParkingSpot('F1-S01', 1, 1, SpotType.MEDIUM);

  describe('HourlyPricingStrategy', () => {
    const strategy = new HourlyPricingStrategy();

    it('should charge 0 if vehicle leaves within the 15-minute grace period', () => {
      const car = new Car('CAR-GRACE');
      const now = Date.now();
      const ticket = new Ticket('T-1', car, dummySpot, 'GATE-IN-1', new Date(now - 10 * 60 * 1000)); // 10 mins ago

      const result = strategy.calculateFee(ticket, new Date(now));
      assert.strictEqual(result.totalFee, 0);
      assert.strictEqual(result.billableHours, 0);
    });

    it('should charge 1 hour rate for stay between 16 and 60 minutes', () => {
      const car = new Car('CAR-1HR');
      const now = Date.now();
      const ticket = new Ticket('T-2', car, dummySpot, 'GATE-IN-1', new Date(now - 45 * 60 * 1000)); // 45 mins

      const result = strategy.calculateFee(ticket, new Date(now));
      assert.strictEqual(result.billableHours, 1);
      assert.strictEqual(result.totalFee, 20); // Car rate is 20/hr
    });

    it('should ceil partial hours (e.g. 75 minutes = 2 billable hours)', () => {
      const bike = new Motorcycle('BIKE-2HR');
      const now = Date.now();
      const ticket = new Ticket('T-3', bike, dummySpot, 'GATE-IN-1', new Date(now - 75 * 60 * 1000)); // 1 hr 15 mins

      const result = strategy.calculateFee(ticket, new Date(now));
      assert.strictEqual(result.billableHours, 2);
      assert.strictEqual(result.totalFee, 20); // Bike rate is 10/hr * 2 hrs = 20
    });

    it('should calculate correct rates for bus and electric vehicle', () => {
      const now = Date.now();
      const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000);

      const busTicket = new Ticket('T-BUS', new Bus('BUS-1'), dummySpot, 'GATE-IN-1', threeHoursAgo);
      const evTicket = new Ticket('T-EV', new ElectricCar('EV-1'), dummySpot, 'GATE-IN-1', threeHoursAgo);

      const busResult = strategy.calculateFee(busTicket, new Date(now));
      const evResult = strategy.calculateFee(evTicket, new Date(now));

      assert.strictEqual(busResult.totalFee, 150); // 3 hrs * $50 = 150
      assert.strictEqual(evResult.totalFee, 75);   // 3 hrs * $25 = 75
    });
  });

  describe('DynamicPricingStrategy (Surge Multipliers)', () => {
    const dynamicStrategy = new DynamicPricingStrategy();

    it('should apply 1.5x surge when occupancy is 85%', () => {
      const car = new Car('CAR-SURGE-1');
      const now = Date.now();
      const ticket = new Ticket('T-4', car, dummySpot, 'GATE-IN-1', new Date(now - 60 * 60 * 1000)); // 1 hr ($20 base)

      const result = dynamicStrategy.calculateFee(ticket, new Date(now), 85);
      assert.strictEqual(result.surgeMultiplier, 1.5);
      assert.strictEqual(result.totalFee, 30); // 20 * 1.5 = 30
    });

    it('should apply 2.0x surge when occupancy is 96%', () => {
      const car = new Car('CAR-SURGE-2');
      const now = Date.now();
      const ticket = new Ticket('T-5', car, dummySpot, 'GATE-IN-1', new Date(now - 60 * 60 * 1000)); // 1 hr ($20 base)

      const result = dynamicStrategy.calculateFee(ticket, new Date(now), 96);
      assert.strictEqual(result.surgeMultiplier, 2.0);
      assert.strictEqual(result.totalFee, 40); // 20 * 2.0 = 40
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
