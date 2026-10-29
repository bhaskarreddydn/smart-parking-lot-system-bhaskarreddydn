/**
 * Pricing Configuration
 * Standard base rates, grace periods, and surge policy.
 */

import { VehicleType } from '../models/Vehicle';

export interface SurgeThreshold {
  minOccupancyPercent: number;
  multiplier: number;
}

export interface PricingConfigSchema {
  GRACE_PERIOD_MINUTES: number;
  BASE_RATES: Record<VehicleType, number>;
  MINIMUM_HOURS: number;
  SURGE_ENABLED: boolean;
  SURGE_THRESHOLDS: SurgeThreshold[];
}

export const DEFAULT_HOURLY_RATES: Record<VehicleType, number> = {
  [VehicleType.MOTORCYCLE]: 10,
  [VehicleType.CAR]: 20,
  [VehicleType.ELECTRIC]: 25,
  [VehicleType.BUS]: 50
};

export const PRICING_CONFIG: PricingConfigSchema = {
  GRACE_PERIOD_MINUTES: 15,
  BASE_RATES: DEFAULT_HOURLY_RATES,
  MINIMUM_HOURS: 1,
  SURGE_ENABLED: true,
  SURGE_THRESHOLDS: [
    { minOccupancyPercent: 95, multiplier: 2.0 },
    { minOccupancyPercent: 80, multiplier: 1.5 },
    { minOccupancyPercent: 0, multiplier: 1.0 }
  ]
};
