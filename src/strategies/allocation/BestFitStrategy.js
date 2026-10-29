/**
 * BestFitStrategy (Allocation Strategy Pattern)
 * Prioritizes the most space-efficient spot type for the vehicle to prevent large
 * spot starvation, breaking ties by distance to entry.
 */

const { AllocationStrategy } = require('./AllocationStrategy');
const { CompatibilityMap } = require('../../models/ParkingSpot');

class BestFitStrategy extends AllocationStrategy {
  findSpot(floors, vehicle) {
    const preferredTypes = CompatibilityMap[vehicle.getType()] || [];

    // Iterate through preference order (e.g. SMALL before MEDIUM before LARGE for Motorcycle)
    for (const preferredType of preferredTypes) {
      let candidateSpot = null;
      let minDistance = Infinity;

      for (const floor of floors) {
        const availableSpots = floor.getAvailableSpots().filter(s => s.spotType === preferredType);

        for (const spot of availableSpots) {
          if (spot.distanceFromEntry < minDistance) {
            minDistance = spot.distanceFromEntry;
            candidateSpot = spot;
          }
        }
      }

      if (candidateSpot) {
        return candidateSpot;
      }
    }

    return null;
  }
}

module.exports = { BestFitStrategy };
