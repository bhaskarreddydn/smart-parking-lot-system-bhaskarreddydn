/**
 * NearestSpotStrategy (Allocation Strategy Pattern)
 * Selects the available spot closest to the entry gate (lower floor, lower distance score).
 */

const { AllocationStrategy } = require('./AllocationStrategy');

class NearestSpotStrategy extends AllocationStrategy {
  findSpot(floors, vehicle) {
    let nearestSpot = null;
    let minDistance = Infinity;

    // Scan floors from ground level up
    for (const floor of floors) {
      const candidates = floor.getAvailableSpotsForVehicle(vehicle);

      for (const spot of candidates) {
        if (spot.distanceFromEntry < minDistance) {
          minDistance = spot.distanceFromEntry;
          nearestSpot = spot;
        }
      }

      // If we found a candidate on this floor and it's lower than what upper floors can offer
      if (nearestSpot && minDistance < ((floor.floorNumber + 1) * 100)) {
        return nearestSpot;
      }
    }

    return nearestSpot;
  }
}

module.exports = { NearestSpotStrategy };
