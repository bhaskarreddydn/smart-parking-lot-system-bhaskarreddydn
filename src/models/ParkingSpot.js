/**
 * ParkingSpot Domain Model
 * Represents a physical parking slot with dimensions, floor location, and occupancy status.
 */

const { VehicleType } = require('./Vehicle');

const SpotType = Object.freeze({
  SMALL: 'SMALL',       // For Motorcycles, Scooters
  MEDIUM: 'MEDIUM',     // For standard Cars, Sedans, Hatchbacks
  LARGE: 'LARGE',       // For Buses, Vans, Trucks
  ELECTRIC: 'ELECTRIC'  // For EV vehicles with charging infrastructure
});

// Mapping of vehicle types to acceptable spot types (in order of preference)
const CompatibilityMap = {
  [VehicleType.MOTORCYCLE]: [SpotType.SMALL, SpotType.MEDIUM, SpotType.LARGE],
  [VehicleType.CAR]: [SpotType.MEDIUM, SpotType.LARGE],
  [VehicleType.BUS]: [SpotType.LARGE],
  [VehicleType.ELECTRIC]: [SpotType.ELECTRIC, SpotType.MEDIUM, SpotType.LARGE]
};

class ParkingSpot {
  /**
   * @param {string} id - Unique identifier e.g. "F1-S01"
   * @param {number} floorNumber - Floor number (1, 2, 3...)
   * @param {number} spotNumber - Number on that floor
   * @param {string} spotType - SpotType enum
   * @param {number} distanceFromEntry - Normalized distance (meters or walking score)
   */
  constructor(id, floorNumber, spotNumber, spotType, distanceFromEntry = 10) {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid spot ID is required');
    }
    if (!Object.values(SpotType).includes(spotType)) {
      throw new Error(`Invalid spot type: ${spotType}`);
    }

    this.id = id;
    this.floorNumber = floorNumber;
    this.spotNumber = spotNumber;
    this.spotType = spotType;
    this.distanceFromEntry = distanceFromEntry;
    this.isOccupied = false;
    this.currentVehicle = null;
    this.occupiedSince = null;
  }

  /**
   * Determines if this spot can accommodate a given vehicle
   * @param {Vehicle} vehicle
   * @returns {boolean}
   */
  canFitVehicle(vehicle) {
    if (!vehicle) return false;
    if (this.isOccupied) return false;

    const allowedSpotTypes = CompatibilityMap[vehicle.getType()];
    return allowedSpotTypes ? allowedSpotTypes.includes(this.spotType) : false;
  }

  /**
   * Assigns a vehicle to this spot
   * @param {Vehicle} vehicle
   */
  assignVehicle(vehicle) {
    if (this.isOccupied) {
      throw new Error(`Spot ${this.id} is already occupied`);
    }
    if (!this.canFitVehicle(vehicle)) {
      throw new Error(`Spot ${this.id} (${this.spotType}) cannot accommodate vehicle type ${vehicle.getType()}`);
    }

    this.isOccupied = true;
    this.currentVehicle = vehicle;
    this.occupiedSince = new Date();
  }

  /**
   * Vacates the spot and returns the vehicle that was parked
   * @returns {Vehicle}
   */
  vacate() {
    if (!this.isOccupied) {
      throw new Error(`Spot ${this.id} is already vacant`);
    }

    const previousVehicle = this.currentVehicle;
    this.isOccupied = false;
    this.currentVehicle = null;
    this.occupiedSince = null;
    return previousVehicle;
  }

  toJSON() {
    return {
      id: this.id,
      floorNumber: this.floorNumber,
      spotNumber: this.spotNumber,
      spotType: this.spotType,
      isOccupied: this.isOccupied,
      distanceFromEntry: this.distanceFromEntry,
      occupiedSince: this.occupiedSince,
      vehicle: this.currentVehicle ? {
        licensePlate: this.currentVehicle.getLicensePlate(),
        type: this.currentVehicle.getType()
      } : null
    };
  }
}

module.exports = {
  SpotType,
  CompatibilityMap,
  ParkingSpot
};
