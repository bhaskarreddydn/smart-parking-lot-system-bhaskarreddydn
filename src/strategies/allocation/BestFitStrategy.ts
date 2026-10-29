/**
 * BestFitStrategy (Allocation Strategy Pattern)
 * Prioritizes the most space-efficient spot type for the vehicle to prevent large
 * spot starvation, breaking ties by distance to entry.
 */

import { IAllocationStrategy } from './AllocationStrategy';
import { Floor } from '../../models/Floor';
import { ParkingSpot, CompatibilityMap } from '../../models/ParkingSpot';
import { Vehicle } from '../../models/Vehicle';

export class BestFitStrategy implements IAllocationStrategy {
  public findSpot(floors: Floor[], vehicle: Vehicle): ParkingSpot | null {
    const preferredTypes = CompatibilityMap[vehicle.getType()] || [];

    // Iterate through preference order (e.g. SMALL before MEDIUM before LARGE for Motorcycle)
    for (const preferredType of preferredTypes) {
      let candidateSpot: ParkingSpot | null = null;
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
