/**
 * PricingStrategy Base Interface (Strategy Pattern)
 */

class PricingStrategy {
  /**
   * Calculates fee for a completed ticket
   * @param {Ticket} ticket
   * @param {Date} exitTime
   * @param {number} currentOccupancyPercent - 0 to 100
   * @returns {{ totalFee: number, billableHours: number, breakdown: object }}
   */
  calculateFee(ticket, exitTime, currentOccupancyPercent = 0) {
    throw new Error('Method calculateFee() must be implemented by concrete strategy');
  }
}

module.exports = { PricingStrategy };
