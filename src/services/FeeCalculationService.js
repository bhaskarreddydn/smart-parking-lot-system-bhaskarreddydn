/**
 * FeeCalculationService
 * Computes parking fees using dynamic or standard hourly pricing strategies.
 */

const { HourlyPricingStrategy } = require('../strategies/pricing/HourlyPricingStrategy');
const { DynamicPricingStrategy } = require('../strategies/pricing/DynamicPricingStrategy');

class FeeCalculationService {
  /**
   * @param {PricingStrategy} strategy
   */
  constructor(strategy = new DynamicPricingStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * Calculates parking fee
   * @param {Ticket} ticket
   * @param {Date} exitTime
   * @param {number} occupancyPercent
   * @returns {{ totalFee: number, billableHours: number, breakdown: object }}
   */
  calculate(ticket, exitTime = new Date(), occupancyPercent = 0) {
    return this.strategy.calculateFee(ticket, exitTime, occupancyPercent);
  }
}

module.exports = {
  FeeCalculationService,
  HourlyPricingStrategy,
  DynamicPricingStrategy
};
