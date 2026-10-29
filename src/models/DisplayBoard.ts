/**
 * DisplayBoard Model (Observer Pattern)
 * Displays real-time counts of available spots by spot type.
 */

import { ParkingSpot, SpotType } from './ParkingSpot';

export interface DisplayStatus {
  displayId: string;
  floorNumber: number | null;
  totalSpots: number;
  occupiedSpots: number;
  freeSpots: number;
  isFull: boolean;
  availableByType: Record<SpotType, number>;
  lastUpdated: Date;
}

export class DisplayBoard {
  public readonly id: string;
  public readonly floorNumber: number | null;
  public availableCounts: Record<SpotType, number>;
  public totalSpots: number;
  public occupiedSpots: number;
  public lastUpdated: Date;

  constructor(id: string, floorNumber: number | null = null) {
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

  public update(spots: ParkingSpot[]): void {
    const counts: Record<SpotType, number> = {
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

  public getDisplayStatus(): DisplayStatus {
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
