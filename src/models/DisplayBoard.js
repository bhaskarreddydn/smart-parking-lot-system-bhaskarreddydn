/**
 * DisplayBoard Model (Observer Pattern)
 * Displays real-time counts of available spots by spot type.
 */

const { SpotType } = require('./ParkingSpot');

class DisplayBoard {
  /**
   * @param {string} id - Identifier e.g. "DISPLAY-F1" or "DISPLAY-MAIN"
   * @param {number|null} floorNumber - Associated floor number, or null for lot-wide board
   */
  constructor(id, floorNumber = null) {
    this.id = id;
    this.floorNumber = floorNumber;
    this.availableCounts = {
      [SpotType.SMALL]: 0,
      [SpotType.MEDIUM]: 0,
      [SpotType.LARGE]: 0,
      [SpotType.ELECTRIC]: 0
    };
    this.totalSpots = 0;
    this.occupiedSpots = 0;
    this.lastUpdated = new Date();
  }

  /**
   * Recalculates metrics based on active spots
   * @param {ParkingSpot[]} spots
   */
  update(spots) {
    const counts = {
      [SpotType.SMALL]: 0,
      [SpotType.MEDIUM]: 0,
      [SpotType.LARGE]: 0,
      [SpotType.ELECTRIC]: 0
    };

    let total = 0;
    let occupied = 0;

    for (const spot of spots) {
      total += 1;
      if (spot.isOccupied) {
        occupied += 1;
      } else {
        counts[spot.spotType] = (counts[spot.spotType] || 0) + 1;
      }
    }

    this.availableCounts = counts;
    this.totalSpots = total;
    this.occupiedSpots = occupied;
    this.lastUpdated = new Date();
  }

  getDisplayStatus() {
    return {
      displayId: this.id,
      floorNumber: this.floorNumber,
      totalSpots: this.totalSpots,
      occupiedSpots: this.occupiedSpots,
      freeSpots: this.totalSpots - this.occupiedSpots,
      isFull: (this.totalSpots - this.occupiedSpots) === 0,
      availableByType: { ...this.availableCounts },
      lastUpdated: this.lastUpdated
    };
  }
}

module.exports = { DisplayBoard };
