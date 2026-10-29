/**
 * Vehicle Factory (Factory Pattern)
 * Instantiates concrete Vehicle objects according to vehicle type.
 */

import {
  Vehicle,
  VehicleType,
  Motorcycle,
  Car,
  Bus,
  ElectricCar
} from '../models/Vehicle';

export class VehicleFactory {
  public static createVehicle(licensePlate: string, type: VehicleType | string): Vehicle {
    const normalizedType = (type || '').trim().toUpperCase() as VehicleType;

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
