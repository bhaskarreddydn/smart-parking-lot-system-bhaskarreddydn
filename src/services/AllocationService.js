/**
 * AllocationService
 * Handles spot search and assignment logic using pluggable strategies.
 */

const { NearestSpotStrategy } = require('../strategies/allocation/NearestSpotStrategy');
const { BestFitStrategy } = require('../strategies/allocation/BestFitStrategy');

class AllocationService {
  /**
   * @param {AllocationStrategy} strategy
   */
  constructor(strategy = new NearestSpotStrategy()) {
    this.strategy = strategy;
  }

  /**
   * Sets the active allocation strategy
   * @param {AllocationStrategy} strategy
   */
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * Finds and atomically reserves an available parking spot
   * @param {Floor[]} floors
   * @param {Vehicle} vehicle
   * @returns {ParkingSpot}
   */
  allocateSpot(floors, vehicle) {
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

  /**
   * Releases a parking spot
   * @param {Floor[]} floors
   * @param {string} spotId
   * @returns {Vehicle}
   */
  releaseSpot(floors, spotId) {
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

module.exports = {
  AllocationService,
  NearestSpotStrategy,
  BestFitStrategy
};
