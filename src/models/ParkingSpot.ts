/**
 * ParkingSpot Domain Model
 * Represents a physical parking slot with dimensions, floor location, and occupancy status.
 */

import { Vehicle, VehicleType } from './Vehicle';

export enum SpotType {
  SMALL = 'SMALL',       // For Motorcycles, Scooters
  MEDIUM = 'MEDIUM',     // For standard Cars, Sedans
  LARGE = 'LARGE',       // For Buses, Vans, Trucks
  ELECTRIC = 'ELECTRIC'  // For EV vehicles with charging infrastructure
}

// Vehicle to Spot compatibility map (in order of preference)
export const CompatibilityMap: Record<VehicleType, SpotType[]> = {
  [VehicleType.MOTORCYCLE]: [SpotType.SMALL, SpotType.MEDIUM, SpotType.LARGE],
  [VehicleType.CAR]: [SpotType.MEDIUM, SpotType.LARGE],
  [VehicleType.BUS]: [SpotType.LARGE],
  [VehicleType.ELECTRIC]: [SpotType.ELECTRIC, SpotType.MEDIUM, SpotType.LARGE]
};

export class ParkingSpot {
  public readonly id: string;
  public readonly floorNumber: number;
  public readonly spotNumber: number;
  public readonly spotType: SpotType;
  public readonly distanceFromEntry: number;
  public isOccupied: boolean;
  public currentVehicle: Vehicle | null;
  public occupiedSince: Date | null;

  constructor(
    id: string,
    floorNumber: number,
    spotNumber: number,
    spotType: SpotType,
    distanceFromEntry: number = 10
  ) {
    if (!id || typeof id !== 'string') {
      throw new Error('Valid spot ID is required');
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

  public canFitVehicle(vehicle: Vehicle | null): boolean {
    if (!vehicle || this.isOccupied) return false;
    const allowed = CompatibilityMap[vehicle.getType()];
    return allowed ? allowed.includes(this.spotType) : false;
  }

  public assignVehicle(vehicle: Vehicle): void {
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

  public vacate(): Vehicle {
    if (!this.isOccupied || !this.currentVehicle) {
      throw new Error(`Spot ${this.id} is already vacant`);
    }

    const previousVehicle = this.currentVehicle;
    this.isOccupied = false;
    this.currentVehicle = null;
    this.occupiedSince = null;
    return previousVehicle;
  }

  public toJSON() {
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
