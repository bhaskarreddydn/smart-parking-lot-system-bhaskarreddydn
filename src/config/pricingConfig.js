/**
 * Pricing Configuration
 * Standard base rates, grace periods, and surge policy.
 */

const { VehicleType } = require('../models/Vehicle');

const DEFAULT_HOURLY_RATES = {
  [VehicleType.MOTORCYCLE]: 10,
  [VehicleType.CAR]: 20,
  [VehicleType.ELECTRIC]: 25,
  [VehicleType.BUS]: 50
};

const PRICING_CONFIG = {
  GRACE_PERIOD_MINUTES: 15, // Free if exited within 15 minutes
  BASE_RATES: DEFAULT_HOURLY_RATES,
  MINIMUM_HOURS: 1,
  SURGE_ENABLED: true,
  SURGE_THRESHOLDS: [
    { minOccupancyPercent: 95, multiplier: 2.0 },
    { minOccupancyPercent: 80, multiplier: 1.5 },
    { minOccupancyPercent: 0, multiplier: 1.0 }
  ]
};

module.exports = {
  DEFAULT_HOURLY_RATES,
  PRICING_CONFIG
};
