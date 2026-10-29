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

  /**
   * Abstract method: Each concrete vehicle defines its supported spot compatibility
   */
  public abstract getPreferredSpotTypes(): string[];
}

export class Motorcycle extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.MOTORCYCLE);
  }

  public getPreferredSpotTypes(): string[] {
    return ['SMALL', 'MEDIUM', 'LARGE'];
  }
}

export class Car extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.CAR);
  }

  public getPreferredSpotTypes(): string[] {
    return ['MEDIUM', 'LARGE'];
  }
}

export class Bus extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.BUS);
  }

  public getPreferredSpotTypes(): string[] {
    return ['LARGE'];
  }
}

export class ElectricCar extends Vehicle {
  constructor(licensePlate: string) {
    super(licensePlate, VehicleType.ELECTRIC);
  }

  public getPreferredSpotTypes(): string[] {
    return ['ELECTRIC', 'MEDIUM', 'LARGE'];
  }
}
