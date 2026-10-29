/**
 * AllocationService
 * Handles spot search and assignment logic using pluggable strategies.
 */

import { IAllocationStrategy } from '../strategies/allocation/AllocationStrategy';
import { NearestSpotStrategy } from '../strategies/allocation/NearestSpotStrategy';
import { BestFitStrategy } from '../strategies/allocation/BestFitStrategy';
import { Floor } from '../models/Floor';
import { Vehicle } from '../models/Vehicle';
import { ParkingSpot } from '../models/ParkingSpot';

export class AllocationService {
  private strategy: IAllocationStrategy;

  constructor(strategy: IAllocationStrategy = new NearestSpotStrategy()) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: IAllocationStrategy): void {
    this.strategy = strategy;
  }

  public allocateSpot(floors: Floor[], vehicle: Vehicle): ParkingSpot {
    const spot = this.strategy.findSpot(floors, vehicle);
    if (!spot) {
      throw new Error(`Parking Lot is FULL for vehicle type '${vehicle.getType()}'. No suitable spot available.`);
    }

    spot.assignVehicle(vehicle);

    // Update floor display board
    const floor = floors.find(f => f.floorNumber === spot.floorNumber);
    if (floor) {
      floor.notifyDisplayBoard();
    }

    return spot;
  }

  public releaseSpot(floors: Floor[], spotId: string): Vehicle {
    for (const floor of floors) {
      const spot = floor.getSpot(spotId);
      if (spot) {
        const vehicle = spot.vacate();
        floor.notifyDisplayBoard();
        return vehicle;
      }
    }
    throw new Error(`Spot ${spotId} not found`);
  }
}

export { NearestSpotStrategy, BestFitStrategy };
