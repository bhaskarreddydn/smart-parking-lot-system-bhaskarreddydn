/**
 * HourlyPricingStrategy (Pricing Strategy Pattern)
 * Calculates fee on an hourly basis with a 15-minute grace period.
 */

import { IPricingStrategy, FeeCalculationResult } from './PricingStrategy';
import { Ticket } from '../../models/Ticket';
import { VehicleType } from '../../models/Vehicle';
import { PRICING_CONFIG } from '../../config/pricingConfig';

export class HourlyPricingStrategy implements IPricingStrategy {
  protected readonly rates: Record<VehicleType, number>;
  protected readonly gracePeriodMinutes: number;

  constructor(
    rates: Record<VehicleType, number> = PRICING_CONFIG.BASE_RATES,
    gracePeriodMinutes: number = PRICING_CONFIG.GRACE_PERIOD_MINUTES
  ) {
    this.rates = rates;
    this.gracePeriodMinutes = gracePeriodMinutes;
  }

  public calculateFee(
    ticket: Ticket,
    exitTime: Date = new Date(),
    _currentOccupancyPercent: number = 0
  ): FeeCalculationResult {
    const entryTime = new Date(ticket.entryTime);
    const exit = new Date(exitTime);

    if (exit < entryTime) {
      throw new Error('Exit time cannot be earlier than entry time');
    }

    const durationMs = exit.getTime() - entryTime.getTime();
    const durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));

    const hourlyRate = this.rates[ticket.vehicleType] || 20;

    // Check grace period
    if (durationMinutes <= this.gracePeriodMinutes) {
      return {
        totalFee: 0,
        billableHours: 0,
        durationMinutes,
        hourlyRate,
        breakdown: {
          note: `Stayed within grace period of ${this.gracePeriodMinutes} mins. No charge.`,
          durationMinutes,
          billableHours: 0
        }
      };
    }

    // Billable hours: ceiling of (durationMinutes / 60)
    const billableHours = Math.max(1, Math.ceil(durationMinutes / 60));
    const totalFee = billableHours * hourlyRate;

    return {
      totalFee,
      billableHours,
      durationMinutes,
      hourlyRate,
      breakdown: {
        ratePerHour: hourlyRate,
        billableHours,
        durationMinutes,
        subtotal: totalFee
      }
    };
  }
}
