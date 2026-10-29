/**
 * Spot Factory (Factory Pattern)
 * Creates ParkingSpot instances with standardized IDs and distance weights.
 */

const { ParkingSpot, SpotType } = require('../models/ParkingSpot');

class SpotFactory {
  /**
   * @param {number} floorNumber
   * @param {number} spotNumber
   * @param {string} spotType - SpotType enum
   * @param {number|null} distanceOverride
   * @returns {ParkingSpot}
   */
  static createSpot(floorNumber, spotNumber, spotType, distanceOverride = null) {
    const paddedSpot = String(spotNumber).padStart(2, '0');
    const id = `F${floorNumber}-S${paddedSpot}`;

    // Base distance formula: floor penalty (floor * 100) + spot walking distance (spot * 5)
    const calculatedDistance = distanceOverride !== null
      ? distanceOverride
      : (floorNumber * 100) + (spotNumber * 5);

    return new ParkingSpot(id, floorNumber, spotNumber, spotType, calculatedDistance);
  }
}

module.exports = { SpotFactory };
