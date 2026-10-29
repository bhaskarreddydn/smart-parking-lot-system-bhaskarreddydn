/**
 * AllocationStrategy Base Interface (Strategy Pattern)
 */

class AllocationStrategy {
  /**
   * Selects an optimal spot for the vehicle among all floors
   * @param {Floor[]} floors - Array of Floor instances
   * @param {Vehicle} vehicle - Vehicle to park
   * @returns {ParkingSpot|null}
   */
  findSpot(floors, vehicle) {
    throw new Error('Method findSpot() must be implemented by concrete strategy');
  }
}

module.exports = { AllocationStrategy };
