/**
 * Fair-Market Valuation Algorithm for Second-Hand Smartphones
 */

// Base reference prices for models in India market (approximate baseline for pristine 128GB)
const BASE_MARKET_VALUES = {
  'iphone 15 pro max': 105000,
  'iphone 15 pro': 92000,
  'iphone 15': 54000,
  'iphone 14 pro max': 82000,
  'iphone 14 pro': 72000,
  'iphone 14': 46000,
  'iphone 13 pro': 56000,
  'iphone 13': 36000,
  'iphone 12': 27000,
  'iphone 11': 19000,
  'galaxy s24 ultra': 89000,
  'galaxy s23 ultra': 69000,
  'galaxy s23': 42000,
  'galaxy s22 ultra': 45000,
  'galaxy s21 fe': 24000,
  'galaxy a54': 18000,
  'oneplus 12': 49000,
  'oneplus 11r': 28000,
  'oneplus 11': 34000,
  'oneplus 10t': 22000,
  'oneplus nord ce 3': 15000,
  'pixel 8 pro': 62000,
  'pixel 8': 44000,
  'pixel 7': 29000,
  'pixel 7a': 23000
};

const CONDITION_MULTIPLIERS = {
  'Pristine': 1.0,
  'Like New': 0.94,
  'Good': 0.85,
  'Fair': 0.72
};

const STORAGE_MULTIPLIERS = {
  '64GB': 0.9,
  '128GB': 1.0,
  '256GB': 1.12,
  '512GB': 1.25,
  '1TB': 1.4
};

const estimatePrice = ({ model, storage = '128GB', condition = 'Like New', batteryHealth = 90 }) => {
  const normalizedModel = (model || '').toLowerCase().trim();
  
  // Find closest base price or fallback to sensible default
  let basePrice = 30000;
  for (const [key, price] of Object.entries(BASE_MARKET_VALUES)) {
    if (normalizedModel.includes(key) || key.includes(normalizedModel)) {
      basePrice = price;
      break;
    }
  }

  const condMultiplier = CONDITION_MULTIPLIERS[condition] || 0.9;
  const storageMultiplier = STORAGE_MULTIPLIERS[storage] || 1.0;
  
  // Battery health adjustment (baseline is 90%)
  const batteryPct = Math.min(100, Math.max(50, Number(batteryHealth) || 90));
  const batteryFactor = 1 + ((batteryPct - 90) * 0.005); // +/- up to ~5%

  const calculatedBase = basePrice * condMultiplier * storageMultiplier * batteryFactor;
  
  // Round to nearest 500
  const averageMarketPrice = Math.round(calculatedBase / 500) * 500;
  const estimatedMin = Math.round((averageMarketPrice * 0.94) / 500) * 500;
  const estimatedMax = Math.round((averageMarketPrice * 1.06) / 500) * 500;
  const suggestedListPrice = Math.round((averageMarketPrice * 1.01) / 100) * 100 - 1; // e.g. 34999

  return {
    model: `${model || 'Smartphone'} (${storage})`,
    estimatedMin,
    estimatedMax,
    averageMarketPrice,
    suggestedListPrice: Math.max(suggestedListPrice, estimatedMin)
  };
};

module.exports = {
  estimatePrice
};
