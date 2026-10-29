import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import { Floor } from '../../src/models/Floor';
import { ParkingSpot, SpotType } from '../../src/models/ParkingSpot';
import { Car, Motorcycle, Bus } from '../../src/models/Vehicle';
import { NearestSpotStrategy } from '../../src/strategies/allocation/NearestSpotStrategy';
import { BestFitStrategy } from '../../src/strategies/allocation/BestFitStrategy';
import { AllocationService } from '../../src/services/AllocationService';

describe('Spot Allocation Strategies Test Suite (TypeScript)', () => {
  let floors: Floor[];

  beforeEach(() => {
    floors = [
      new Floor(1, 'Floor 1'),
      new Floor(2, 'Floor 2')
    ];

    // Floor 1: 1 SMALL, 1 MEDIUM (dist 105), 1 LARGE (dist 110)
    floors[0].addSpot(new ParkingSpot('F1-S01', 1, 1, SpotType.SMALL, 105));
    floors[0].addSpot(new ParkingSpot('F1-S02', 1, 2, SpotType.MEDIUM, 110));
    floors[0].addSpot(new ParkingSpot('F1-S03', 1, 3, SpotType.LARGE, 115));

    // Floor 2: 1 MEDIUM (dist 205), 1 LARGE (dist 210)
    floors[1].addSpot(new ParkingSpot('F2-S01', 2, 1, SpotType.MEDIUM, 205));
    floors[1].addSpot(new ParkingSpot('F2-S02', 2, 2, SpotType.LARGE, 210));
  });

  describe('NearestSpotStrategy', () => {
    it('should assign the spot on the lowest floor with minimum distance', () => {
      const strategy = new NearestSpotStrategy();
      const car = new Car('CAR-NEAREST');

      const spot = strategy.findSpot(floors, car);
      assert.ok(spot);
      assert.strictEqual(spot!.id, 'F1-S02');
    });

    it('should allocate large vehicle only to LARGE spot', () => {
      const strategy = new NearestSpotStrategy();
      const bus = new Bus('BUS-NEAREST');

      const spot = strategy.findSpot(floors, bus);
      assert.ok(spot);
      assert.strictEqual(spot!.id, 'F1-S03');
    });
  });

  describe('BestFitStrategy', () => {
    it('should prioritize SMALL spot over LARGE spot for motorcycle to save space', () => {
      const strategy = new BestFitStrategy();
      const bike = new Motorcycle('BIKE-BESTFIT');

      const spot = strategy.findSpot(floors, bike);
      assert.ok(spot);
      assert.strictEqual(spot!.id, 'F1-S01');
      assert.strictEqual(spot!.spotType, SpotType.SMALL);
    });

    it('should choose MEDIUM spot for car even when LARGE spot is also available', () => {
      const strategy = new BestFitStrategy();
      const car = new Car('CAR-BESTFIT');

      const spot = strategy.findSpot(floors, car);
      assert.ok(spot);
      assert.strictEqual(spot!.id, 'F1-S02');
      assert.strictEqual(spot!.spotType, SpotType.MEDIUM);
    });
  });

  describe('AllocationService Error Handling', () => {
    it('should throw clean error when parking lot is full for the vehicle type', () => {
      const service = new AllocationService(new NearestSpotStrategy());

      // Occupy all LARGE spots
      floors[0].getSpot('F1-S03')!.assignVehicle(new Bus('B1'));
      floors[1].getSpot('F2-S02')!.assignVehicle(new Bus('B2'));

      // Next bus should fail
      const nextBus = new Bus('B3');
      assert.throws(
        () => service.allocateSpot(floors, nextBus),
        /Parking Lot is FULL for vehicle type 'BUS'/
      );
    });
  });
});
