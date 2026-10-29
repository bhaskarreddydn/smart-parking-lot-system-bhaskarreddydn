/**
 * Floor Domain Model
 * Represents a single level in a multi-floor parking structure.
 */

const { DisplayBoard } = require('./DisplayBoard');

class Floor {
  /**
   * @param {number} floorNumber - 1-indexed floor number
   * @param {string} name - e.g. "Level 1" or "Basement 1"
   */
  constructor(floorNumber, name = `Floor ${floorNumber}`) {
    this.floorNumber = floorNumber;
    this.name = name;
    this.spots = new Map(); // spotId -> ParkingSpot
    this.displayBoard = new DisplayBoard(`DISPLAY-F${floorNumber}`, floorNumber);
  }

  addSpot(parkingSpot) {
    if (this.spots.has(parkingSpot.id)) {
      throw new Error(`Spot ${parkingSpot.id} already exists on floor ${this.floorNumber}`);
    }
    this.spots.set(parkingSpot.id, parkingSpot);
    this.notifyDisplayBoard();
  }

  getSpot(spotId) {
    return this.spots.get(spotId) || null;
  }

  getAllSpots() {
    return Array.from(this.spots.values());
  }

  getAvailableSpots() {
    return this.getAllSpots().filter(spot => !spot.isOccupied);
  }

  getAvailableSpotsForVehicle(vehicle) {
    return this.getAllSpots().filter(spot => spot.canFitVehicle(vehicle));
  }

  notifyDisplayBoard() {
    this.displayBoard.update(this.getAllSpots());
  }

  getFloorStatus() {
    return {
      floorNumber: this.floorNumber,
      name: this.name,
      display: this.displayBoard.getDisplayStatus(),
      spots: this.getAllSpots().map(s => s.toJSON())
    };
  }
}

module.exports = { Floor };
