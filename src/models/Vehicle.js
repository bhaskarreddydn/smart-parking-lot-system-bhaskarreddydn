/**
 * Vehicle Domain Models
 * Represents vehicles entering and exiting the smart parking lot.
 */

const VehicleType = Object.freeze({
  MOTORCYCLE: 'MOTORCYCLE',
  CAR: 'CAR',
  BUS: 'BUS',
  ELECTRIC: 'ELECTRIC'
});

class Vehicle {
  /**
   * @param {string} licensePlate - Vehicle registration/license plate
   * @param {string} type - VehicleType enum value
   */
  constructor(licensePlate, type) {
    if (!licensePlate || typeof licensePlate !== 'string') {
      throw new Error('Valid license plate is required');
    }
    if (!Object.values(VehicleType).includes(type)) {
      throw new Error(`Invalid vehicle type: ${type}`);
    }
    this.licensePlate = licensePlate.trim().toUpperCase();
    this.type = type;
  }

  getLicensePlate() {
    return this.licensePlate;
  }

  getType() {
    return this.type;
  }
}

class Motorcycle extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.MOTORCYCLE);
  }
}

class Car extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.CAR);
  }
}

class Bus extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.BUS);
  }
}

class ElectricCar extends Vehicle {
  constructor(licensePlate) {
    super(licensePlate, VehicleType.ELECTRIC);
  }
}

module.exports = {
  VehicleType,
  Vehicle,
  Motorcycle,
  Car,
  Bus,
  ElectricCar
};
