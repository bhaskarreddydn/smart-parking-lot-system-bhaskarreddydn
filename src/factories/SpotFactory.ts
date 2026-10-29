/**
 * Spot Factory (Factory Pattern)
 * Creates ParkingSpot instances with standardized IDs and distance weights.
 */

import { ParkingSpot, SpotType } from '../models/ParkingSpot';

export class SpotFactory {
  public static createSpot(
    floorNumber: number,
    spotNumber: number,
    spotType: SpotType,
    distanceOverride: number | null = null
  ): ParkingSpot {
    const paddedSpot = String(spotNumber).padStart(2, '0');
    const id = `F${floorNumber}-S${paddedSpot}`;

    // Base distance formula: floor penalty (floor * 100) + spot walking distance (spot * 5)
    const calculatedDistance = distanceOverride !== null
      ? distanceOverride
      : (floorNumber * 100) + (spotNumber * 5);

    return new ParkingSpot(id, floorNumber, spotNumber, spotType, calculatedDistance);
  }
}
