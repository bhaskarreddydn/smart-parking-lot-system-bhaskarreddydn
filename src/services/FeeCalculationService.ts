/**
 * FeeCalculationService
 * Computes parking fees using dynamic or standard hourly pricing strategies.
 */

import { IPricingStrategy, FeeCalculationResult } from '../strategies/pricing/PricingStrategy';
import { HourlyPricingStrategy } from '../strategies/pricing/HourlyPricingStrategy';
import { DynamicPricingStrategy } from '../strategies/pricing/DynamicPricingStrategy';
import { Ticket } from '../models/Ticket';

export class FeeCalculationService {
  private strategy: IPricingStrategy;

  constructor(strategy: IPricingStrategy = new DynamicPricingStrategy()) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: IPricingStrategy): void {
    this.strategy = strategy;
  }

  public calculate(ticket: Ticket, exitTime: Date = new Date(), occupancyPercent: number = 0): FeeCalculationResult {
    return this.strategy.calculateFee(ticket, exitTime, occupancyPercent);
  }
}

export { HourlyPricingStrategy, DynamicPricingStrategy };
