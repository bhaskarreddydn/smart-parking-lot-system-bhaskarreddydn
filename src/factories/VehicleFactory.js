/**
 * Vehicle Factory (Factory Pattern)
 * Instantiates concrete Vehicle objects according to vehicle type.
 */

const {
  VehicleType,
  Motorcycle,
  Car,
  Bus,
  ElectricCar
} = require('../models/Vehicle');

class VehicleFactory {
  /**
   * @param {string} licensePlate
   * @param {string} type - VehicleType
   * @returns {Vehicle}
   */
  static createVehicle(licensePlate, type) {
    const normalizedType = (type || '').trim().toUpperCase();

    switch (normalizedType) {
      case VehicleType.MOTORCYCLE:
        return new Motorcycle(licensePlate);
      case VehicleType.CAR:
        return new Car(licensePlate);
      case VehicleType.BUS:
        return new Bus(licensePlate);
      case VehicleType.ELECTRIC:
        return new ElectricCar(licensePlate);
      default:
        throw new Error(
          `Unsupported vehicle type '${type}'. Supported types: ${Object.values(VehicleType).join(', ')}`
        );
    }
  }
}

module.exports = { VehicleFactory };
