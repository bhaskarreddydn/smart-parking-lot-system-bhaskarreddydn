/**
 * DynamicPricingStrategy (Pricing Strategy Pattern)
 * Extends hourly pricing with real-time occupancy-based surge multipliers.
 */

import { HourlyPricingStrategy } from './HourlyPricingStrategy';
import { FeeCalculationResult } from './PricingStrategy';
import { Ticket } from '../../models/Ticket';
import { PRICING_CONFIG, SurgeThreshold } from '../../config/pricingConfig';

export class DynamicPricingStrategy extends HourlyPricingStrategy {
  private readonly thresholds: SurgeThreshold[];

  constructor(
    rates = PRICING_CONFIG.BASE_RATES,
    thresholds: SurgeThreshold[] = PRICING_CONFIG.SURGE_THRESHOLDS
  ) {
    super(rates, PRICING_CONFIG.GRACE_PERIOD_MINUTES);
    this.thresholds = thresholds;
  }

  public getMultiplier(occupancyPercent: number): number {
    for (const rule of this.thresholds) {
      if (occupancyPercent >= rule.minOccupancyPercent) {
        return rule.multiplier;
      }
    }
    return 1.0;
  }

  public override calculateFee(
    ticket: Ticket,
    exitTime: Date = new Date(),
    currentOccupancyPercent: number = 0
  ): FeeCalculationResult {
    const baseCalculation = super.calculateFee(ticket, exitTime, currentOccupancyPercent);

    if (baseCalculation.totalFee === 0) {
      return baseCalculation; // Grace period remains 0
    }

    const multiplier = this.getMultiplier(currentOccupancyPercent);
    const totalFee = Math.round(baseCalculation.totalFee * multiplier);

    return {
      totalFee,
      billableHours: baseCalculation.billableHours,
      durationMinutes: baseCalculation.durationMinutes,
      hourlyRate: baseCalculation.hourlyRate,
      surgeMultiplier: multiplier,
      breakdown: {
        ...baseCalculation.breakdown,
        occupancyPercent: currentOccupancyPercent,
        surgeMultiplier: multiplier,
        finalAmount: totalFee
      }
    };
  }
}
