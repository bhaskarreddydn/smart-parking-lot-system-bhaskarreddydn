/**
 * PricingStrategy Base Interface (Strategy Pattern)
 */

import { Ticket } from '../../models/Ticket';

export interface FeeCalculationResult {
  totalFee: number;
  billableHours: number;
  durationMinutes: number;
  hourlyRate: number;
  surgeMultiplier?: number;
  breakdown: Record<string, unknown>;
}

export interface IPricingStrategy {
  /**
   * Calculates fee for a completed ticket
   */
  calculateFee(ticket: Ticket, exitTime?: Date, currentOccupancyPercent?: number): FeeCalculationResult;
}
