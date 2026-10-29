/**
 * DynamicPricingStrategy (Pricing Strategy Pattern)
 * Extends hourly pricing with real-time occupancy-based surge multipliers.
 */

const { HourlyPricingStrategy } = require('./HourlyPricingStrategy');
const { PRICING_CONFIG } = require('../../config/pricingConfig');

class DynamicPricingStrategy extends HourlyPricingStrategy {
  constructor(rates = PRICING_CONFIG.BASE_RATES, thresholds = PRICING_CONFIG.SURGE_THRESHOLDS) {
    super(rates, PRICING_CONFIG.GRACE_PERIOD_MINUTES);
    this.thresholds = thresholds;
  }

  getMultiplier(occupancyPercent) {
    for (const rule of this.thresholds) {
      if (occupancyPercent >= rule.minOccupancyPercent) {
        return rule.multiplier;
      }
    }
    return 1.0;
  }

  calculateFee(ticket, exitTime = new Date(), currentOccupancyPercent = 0) {
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

module.exports = { DynamicPricingStrategy };
