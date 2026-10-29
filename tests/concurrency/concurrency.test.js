const { describe, it } = require('node:test');
const assert = require('node:assert');

const { ParkingLotService } = require('../../src/services/ParkingLotService');
const { VehicleType } = require('../../src/models/Vehicle');
const { PaymentMethod } = require('../../src/models/Payment');

describe('Concurrency & Race Condition Handling Test Suite', () => {
  it('should guarantee 100% unique spot allocations when multiple vehicles enter simultaneously', async () => {
    // Parking lot with 2 floors, 15 spots per floor = 30 total spots
    const parkingLot = new ParkingLotService('Concurrency Test Lot', 2, 15);
    const concurrentCount = 20;

    // Dispatch 20 concurrent vehicle entries at the exact same millisecond
    const entryPromises = Array.from({ length: concurrentCount }).map((_, index) => {
      const plate = `CONC-CAR-${index + 1}`;
      const gate = index % 2 === 0 ? 'GATE-IN-1' : 'GATE-IN-2';
      return parkingLot.processEntry(plate, VehicleType.CAR, gate);
    });

    const tickets = await Promise.all(entryPromises);

    assert.strictEqual(tickets.length, concurrentCount);

    // Verify all allocated spot IDs are unique
    const allocatedSpotIds = tickets.map(t => t.spotId);
    const uniqueSpotIds = new Set(allocatedSpotIds);

    assert.strictEqual(
      uniqueSpotIds.size,
      concurrentCount,
      `Race condition detected! Duplicate spots were assigned: ${allocatedSpotIds.join(', ')}`
    );

    // Verify system occupancy matches exactly
    const status = parkingLot.getSystemStatus();
    assert.strictEqual(status.activeVehiclesCount, concurrentCount);
  });

  it('should gracefully reject excess vehicles without corrupting spots when capacity is reached', async () => {
    // 1 floor with 5 spots
    const parkingLot = new ParkingLotService('Small Lot', 1, 5);

    // Attempt to park 10 cars simultaneously into a 5-spot lot
    const attempts = Array.from({ length: 10 }).map((_, index) => {
      const plate = `OVERFLOW-${index + 1}`;
      return parkingLot.processEntry(plate, VehicleType.CAR, 'GATE-IN-1')
        .then(ticket => ({ success: true, ticket }))
        .catch(error => ({ success: false, error: error.message }));
    });

    const results = await Promise.all(attempts);

    const successful = results.filter(r => r.success);
    const rejected = results.filter(r => !r.success);

    // In a 5 spot lot with small/medium/large distribution, cars fit in medium/large
    assert.strictEqual(successful.length > 0, true);
    assert.strictEqual(rejected.length > 0, true);

    // Ensure all successful spot IDs are unique
    const successfulSpotIds = successful.map(r => r.ticket.spotId);
    assert.strictEqual(new Set(successfulSpotIds).size, successful.length);

    // Ensure rejected errors are clean capacity messages
    rejected.forEach(rej => {
      assert.ok(rej.error.includes('FULL') || rej.error.includes('No suitable spot'));
    });
  });

  it('should handle simultaneous exits and free spots accurately', async () => {
    const parkingLot = new ParkingLotService('Exit Test Lot', 1, 10);

    // Park 5 cars
    const tickets = [];
    for (let i = 0; i < 5; i++) {
      const t = await parkingLot.processEntry(`EXIT-CAR-${i}`, VehicleType.CAR);
      tickets.push(t);
    }

    assert.strictEqual(parkingLot.activeTickets.size, 5);

    // Simultaneous exit
    const exitPromises = tickets.map((t, index) => {
      const gate = index % 2 === 0 ? 'GATE-OUT-1' : 'GATE-OUT-2';
      return parkingLot.processExit(t.ticketId, PaymentMethod.UPI, gate);
    });

    const exitResults = await Promise.all(exitPromises);
    assert.strictEqual(exitResults.length, 5);

    // All spots should now be vacant and active tickets empty
    assert.strictEqual(parkingLot.activeTickets.size, 0);
    assert.strictEqual(parkingLot.completedTickets.size, 5);

    const spots = parkingLot.getAllSpots();
    const occupiedCount = spots.filter(s => s.isOccupied).length;
    assert.strictEqual(occupiedCount, 0);
  });
});
