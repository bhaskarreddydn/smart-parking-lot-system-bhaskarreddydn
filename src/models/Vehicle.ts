/**
 * Vehicle Domain Models
 * Represents vehicles entering and exiting the smart parking lot.
 */

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  BUS = 'BUS',
  ELECTRIC = 'ELECTRIC'
}

export abstract class Vehicle {
  protected readonly licensePlate: string;
  protected readonly type: VehicleType;

  constructor(licensePlate: string, type: VehicleType) {
    if (!licensePlate || typeof licensePlate !== 'string' || licensePlate.trim().length === 0) {
      throw new Error('Valid license plate is required');
    }
    this.licensePlate = licensePlate.trim().toUpperCase();
    this.type = type;
  }

  public getLicensePlate(): string {
    return this.licensePlate;
  }

  public getType(): VehicleType {
    return this.type;
  }
}

export class Motorcycle extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.MOTORCYCLE);
  }
}

export class Car extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.CAR);
  }
}

export class Bus extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.BUS);
  }
}

export class ElectricCar extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.ELECTRIC);
  }
}
