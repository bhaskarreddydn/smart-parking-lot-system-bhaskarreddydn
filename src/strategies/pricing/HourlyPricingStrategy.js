/**
 * HourlyPricingStrategy (Pricing Strategy Pattern)
 * Calculates fee on an hourly basis with a 15-minute grace period.
 */

const { PricingStrategy } = require('./PricingStrategy');
const { PRICING_CONFIG } = require('../../config/pricingConfig');

class HourlyPricingStrategy extends PricingStrategy {
  constructor(rates = PRICING_CONFIG.BASE_RATES, gracePeriodMinutes = PRICING_CONFIG.GRACE_PERIOD_MINUTES) {
    super();
    this.rates = rates;
    this.gracePeriodMinutes = gracePeriodMinutes;
  }

  calculateFee(ticket, exitTime = new Date(), currentOccupancyPercent = 0) {
    const entryTime = new Date(ticket.entryTime);
    const exit = new Date(exitTime);

    if (exit < entryTime) {
      throw new Error('Exit time cannot be earlier than entry time');
    }

    const durationMs = exit.getTime() - entryTime.getTime();
    const durationMinutes = Math.max(0, Math.round(durationMs / (1000 * 60)));

    // Check grace period
    if (durationMinutes <= this.gracePeriodMinutes) {
      return {
        totalFee: 0,
        billableHours: 0,
        durationMinutes,
        hourlyRate: this.rates[ticket.vehicleType] || 20,
        breakdown: {
          note: `Stayed within grace period of ${this.gracePeriodMinutes} mins. No charge.`,
          durationMinutes,
          billableHours: 0
        }
      };
    }

    // Billable hours: ceiling of (durationMinutes / 60)
    const billableHours = Math.max(1, Math.ceil(durationMinutes / 60));
    const hourlyRate = this.rates[ticket.vehicleType] || 20;
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

module.exports = { HourlyPricingStrategy };
