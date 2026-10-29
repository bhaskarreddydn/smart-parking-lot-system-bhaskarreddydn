import { describe, it } from 'node:test';
import assert from 'node:assert';

import { ParkingLotService } from '../../src/services/ParkingLotService';
import { VehicleType } from '../../src/models/Vehicle';
import { PaymentMethod } from '../../src/models/Payment';

describe('Concurrency & Race Condition Handling Test Suite (TypeScript)', () => {
  it('should guarantee 100% unique spot allocations when multiple vehicles enter simultaneously', async () => {
    // 2 floors, 15 spots per floor = 30 total spots
    const parkingLot = new ParkingLotService('Concurrency Test Lot', 2, 15);
    const concurrentCount = 20;

    const entryPromises = Array.from({ length: concurrentCount }).map((_, index) => {
      const plate = `CONC-CAR-${index + 1}`;
      const gate = index % 2 === 0 ? 'GATE-IN-1' : 'GATE-IN-2';
      return parkingLot.processEntry(plate, VehicleType.CAR, gate);
    });

    const tickets = await Promise.all(entryPromises);

    assert.strictEqual(tickets.length, concurrentCount);

    const allocatedSpotIds = tickets.map(t => t.spotId);
    const uniqueSpotIds = new Set(allocatedSpotIds);

    assert.strictEqual(
      uniqueSpotIds.size,
      concurrentCount,
      `Race condition detected! Duplicate spots were assigned: ${allocatedSpotIds.join(', ')}`
    );

    const status = parkingLot.getSystemStatus();
    assert.strictEqual(status.activeVehiclesCount, concurrentCount);
  });

  it('should gracefully reject excess vehicles without corrupting spots when capacity is reached', async () => {
    // 1 floor with 5 spots
    const parkingLot = new ParkingLotService('Small Lot', 1, 5);

    const attempts = Array.from({ length: 10 }).map((_, index) => {
      const plate = `OVERFLOW-${index + 1}`;
      return parkingLot.processEntry(plate, VehicleType.CAR, 'GATE-IN-1')
        .then(ticket => ({ success: true, ticket, error: null }))
        .catch(error => ({ success: false, ticket: null, error: (error as Error).message }));
    });

    const results = await Promise.all(attempts);

    const successful = results.filter(r => r.success);
    const rejected = results.filter(r => !r.success);

    assert.strictEqual(successful.length > 0, true);
    assert.strictEqual(rejected.length > 0, true);

    const successfulSpotIds = successful.map(r => r.ticket!.spotId);
    assert.strictEqual(new Set(successfulSpotIds).size, successful.length);

    rejected.forEach(rej => {
      assert.ok(rej.error!.includes('FULL') || rej.error!.includes('No suitable spot'));
    });
  });

  it('should handle simultaneous exits and free spots accurately', async () => {
    const parkingLot = new ParkingLotService('Exit Test Lot', 1, 10);

    const tickets = [];
    for (let i = 0; i < 5; i++) {
      const t = await parkingLot.processEntry(`EXIT-CAR-${i}`, VehicleType.CAR);
      tickets.push(t);
    }

    assert.strictEqual(parkingLot.activeTickets.size, 5);

    const exitPromises = tickets.map((t, index) => {
      const gate = index % 2 === 0 ? 'GATE-OUT-1' : 'GATE-OUT-2';
      return parkingLot.processExit(t.ticketId, PaymentMethod.UPI, gate);
    });

    const exitResults = await Promise.all(exitPromises);
    assert.strictEqual(exitResults.length, 5);

    assert.strictEqual(parkingLot.activeTickets.size, 0);
    assert.strictEqual(parkingLot.completedTickets.size, 5);

    const spots = parkingLot.getAllSpots();
    const occupiedCount = spots.filter(s => s.isOccupied).length;
    assert.strictEqual(occupiedCount, 0);
  });
});
