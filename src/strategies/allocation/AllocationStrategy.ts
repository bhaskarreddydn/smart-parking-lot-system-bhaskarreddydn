/**
 * AllocationStrategy Interface (Strategy Pattern)
 */

import { Floor } from '../../models/Floor';
import { ParkingSpot } from '../../models/ParkingSpot';
import { Vehicle } from '../../models/Vehicle';

export interface IAllocationStrategy {
  /**
   * Selects an optimal spot for the vehicle among all floors
   */
  findSpot(floors: Floor[], vehicle: Vehicle): ParkingSpot | null;
}
