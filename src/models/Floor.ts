/**
 * Floor Domain Model
 * Represents a single level in a multi-floor parking structure.
 */

import { ParkingSpot } from './ParkingSpot';
import { Vehicle } from './Vehicle';
import { DisplayBoard, DisplayStatus } from './DisplayBoard';

export interface FloorStatus {
  floorNumber: number;
  name: string;
  display: DisplayStatus;
  spots: ReturnType<ParkingSpot['toJSON']>[];
}

export class Floor {
  public readonly floorNumber: number;
  public readonly name: string;
  public readonly spots: Map<string, ParkingSpot>;
  public readonly displayBoard: DisplayBoard;

  constructor(floorNumber: number, name: string = `Floor ${floorNumber}`) {
    this.floorNumber = floorNumber;
    this.name = name;
    this.spots = new Map<string, ParkingSpot>();
    this.displayBoard = new DisplayBoard(`DISPLAY-F${floorNumber}`, floorNumber);
  }

  public addSpot(parkingSpot: ParkingSpot): void {
    if (this.spots.has(parkingSpot.id)) {
      throw new Error(`Spot ${parkingSpot.id} already exists on floor ${this.floorNumber}`);
    }
    this.spots.set(parkingSpot.id, parkingSpot);
    this.notifyDisplayBoard();
  }

  public getSpot(spotId: string): ParkingSpot | null {
    return this.spots.get(spotId) || null;
  }

  public getAllSpots(): ParkingSpot[] {
    return Array.from(this.spots.values());
  }

  public getAvailableSpots(): ParkingSpot[] {
    return this.getAllSpots().filter(spot => !spot.isOccupied);
  }

  public getAvailableSpotsForVehicle(vehicle: Vehicle): ParkingSpot[] {
    return this.getAllSpots().filter(spot => spot.canFitVehicle(vehicle));
  }

  public notifyDisplayBoard(): void {
    this.displayBoard.update(this.getAllSpots());
  }

  public getFloorStatus(): FloorStatus {
    return {
      floorNumber: this.floorNumber,
      name: this.name,
      display: this.displayBoard.getDisplayStatus(),
      spots: this.getAllSpots().map(s => s.toJSON())
    };
  }
}
