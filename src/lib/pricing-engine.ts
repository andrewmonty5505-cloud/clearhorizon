import {
  OccupancyType,
  FlooringType,
  ConditionType,
  FirstTimeType,
  PetLevel,
  MarketArea,
  ServiceFrequency,
} from "@prisma/client";
import type {
  PricingInputs,
  PricingBreakdown,
  AddOnResult,
  PricingConfigMap,
} from "@/types";

// ─── Step 1: Base Labor Hours ────────────────────────────────────────────────

function getBaseHours(sqft: number): number {
  if (sqft <= 1500) return 3.5;
  if (sqft <= 2000) return 4.5;
  if (sqft <= 2500) return 5.5;
  if (sqft <= 3000) return 6.5;
  if (sqft <= 4000) return 8.0;
  if (sqft <= 5000) return 10.0;
  return 10 + ((sqft - 5000) / 500) * 1.25;
}

// ─── Step 2: Bathroom Adjustment ────────────────────────────────────────────

function getBathroomHours(bathrooms: number): number {
  return Math.max(0, bathrooms - 2) * 0.25;
}

// ─── Step 3: Bedroom Adjustment ─────────────────────────────────────────────

function getBedroomHours(bedrooms: number): number {
  if (bedrooms <= 3) return 0;
  if (bedrooms === 4) return 0.25;
  if (bedrooms === 5) return 0.5;
  return 1.0;
}

// ─── Step 4: Pet Adjustment ──────────────────────────────────────────────────

function getPetHours(petLevel: PetLevel): number {
  switch (petLevel) {
    case PetLevel.NO_PETS:
      return 0;
    case PetLevel.ONE_PET:
      return 0.5;
    case PetLevel.TWO_PLUS_PETS:
      return 1.0;
    case PetLevel.HEAVY_SHEDDING:
      return 1.5;
  }
}

// ─── Step 5: Feature Hours ───────────────────────────────────────────────────

function getFeatureHours(inputs: PricingInputs): number {
  let hours = 0;
  if (inputs.hasStairs) hours += 0.5;
  if (inputs.hasElevator) hours += 0.25;
  if (inputs.hasHomeOffice) hours += 0.25;
  if (inputs.hasGym) hours += 0.25;
  if (inputs.hasTheaterRoom) hours += 0.25;
  if (inputs.hasLanai) hours += 0.5;
  if (inputs.hasPoolBath) hours += 0.25;
  return hours;
}

// ─── Step 7: Occupancy Multiplier ────────────────────────────────────────────

function getOccupancyMultiplier(occupancy: OccupancyType): number {
  switch (occupancy) {
    case OccupancyType.SEASONAL_EMPTY:
      return 0.9;
    case OccupancyType.COUPLE:
      return 1.0;
    case OccupancyType.FAMILY:
      return 1.1;
    case OccupancyType.LARGE_FAMILY:
      return 1.2;
    case OccupancyType.VACATION_RENTAL:
      return 1.15;
  }
}

// ─── Step 8: Flooring Multiplier ─────────────────────────────────────────────

function getFlooringMultiplier(flooring: FlooringType): number {
  switch (flooring) {
    case FlooringType.MOSTLY_TILE:
      return 1.0;
    case FlooringType.MOSTLY_HARDWOOD:
      return 1.05;
    case FlooringType.MOSTLY_CARPET:
      return 1.1;
    case FlooringType.LUXURY_MIXED:
      return 1.15;
  }
}

// ─── Step 9: Condition Multiplier ────────────────────────────────────────────

function getConditionMultiplier(condition: ConditionType): number {
  switch (condition) {
    case ConditionType.EXCELLENT:
      return 0.9;
    case ConditionType.AVERAGE:
      return 1.0;
    case ConditionType.DIRTY:
      return 1.2;
    case ConditionType.VERY_DIRTY:
      return 1.5;
  }
}

// ─── Step 10: First-Time Multiplier ──────────────────────────────────────────

function getFirstTimeMultiplier(firstTime: FirstTimeType): number {
  switch (firstTime) {
    case FirstTimeType.EXISTING_CLIENT:
      return 1.0;
    case FirstTimeType.FIRST_VISIT:
      return 1.25;
    case FirstTimeType.INITIAL_DEEP_CLEAN:
      return 1.5;
  }
}

// ─── Step 12: Market Hourly Rate ─────────────────────────────────────────────

function getHourlyRate(market: MarketArea, config: PricingConfigMap): number {
  switch (market) {
    case MarketArea.FORT_MYERS:
      return config.hourlyRate_fortMyers;
    case MarketArea.NAPLES:
      return config.hourlyRate_naples;
    case MarketArea.LUXURY_NAPLES:
      return config.hourlyRate_luxuryNaples;
  }
}

// ─── Step 13: Frequency Multiplier ───────────────────────────────────────────

function getFrequencyMultiplier(
  frequency: ServiceFrequency,
  config: PricingConfigMap
): number {
  switch (frequency) {
    case ServiceFrequency.WEEKLY:
      return config.frequencyMultiplier_weekly;
    case ServiceFrequency.BIWEEKLY:
      return config.frequencyMultiplier_biweekly;
    case ServiceFrequency.MONTHLY:
      return config.frequencyMultiplier_monthly;
    case ServiceFrequency.ONE_TIME:
      return config.frequencyMultiplier_oneTime;
    case ServiceFrequency.DEEP_CLEAN:
      return config.frequencyMultiplier_deepClean;
  }
}

// ─── Step 14: Seasonal Multiplier ────────────────────────────────────────────

export function getSeasonalMultiplier(
  config: PricingConfigMap,
  override?: number | null
): number {
  if (override != null) return override;
  const month = new Date().getMonth() + 1; // 1-12
  // High season: Nov (11) – Apr (4)
  return month >= 11 || month <= 4
    ? config.seasonalMultiplier_high
    : config.seasonalMultiplier_low;
}

// ─── Step 16: Travel Fee ─────────────────────────────────────────────────────

function getTravelFee(
  distanceMiles: number,
  config: PricingConfigMap
): number {
  if (distanceMiles <= 10) return config.travelFee_0_10;
  if (distanceMiles <= 20) return config.travelFee_10_20;
  if (distanceMiles <= 30) return config.travelFee_20_30;
  return -1; // -1 signals "manual review required"
}

// ─── Step 17: Add-On Pricing ─────────────────────────────────────────────────

const ADD_ON_NAMES: Record<string, string> = {
  oven: "Oven Cleaning",
  refrigerator: "Refrigerator Cleaning",
  interiorWindows: "Interior Windows",
  baseboards: "Baseboards",
  ceilingFans: "Ceiling Fans",
  insideCabinets: "Inside Cabinets",
  laundry: "Laundry",
  linens: "Linen Change",
};

function getAddOnUnitPrice(key: string, config: PricingConfigMap): number {
  switch (key) {
    case "oven":
      return config.addon_oven;
    case "refrigerator":
      return config.addon_refrigerator;
    case "interiorWindows":
      return config.addon_interiorWindows;
    case "baseboards":
      return config.addon_baseboards;
    case "ceilingFans":
      return config.addon_ceilingFans;
    case "insideCabinets":
      return config.addon_insideCabinets;
    case "laundry":
      return config.addon_laundry;
    case "linens":
      return config.addon_linens;
    default:
      return 0;
  }
}

function calculateAddOns(
  addOns: PricingInputs["addOns"],
  config: PricingConfigMap
): AddOnResult[] {
  return addOns
    .filter((a) => a.quantity > 0)
    .map((a) => {
      const unitPrice = getAddOnUnitPrice(a.key, config);
      return {
        key: a.key,
        name: ADD_ON_NAMES[a.key] ?? a.key,
        quantity: a.quantity,
        unitPrice,
        totalPrice: unitPrice * a.quantity,
      };
    });
}

// ─── Step 19: Minimum Charge ──────────────────────────────────────────────────

function getMinimumCharge(market: MarketArea, config: PricingConfigMap): number {
  switch (market) {
    case MarketArea.FORT_MYERS:
      return config.minimumCharge_fortMyers;
    case MarketArea.NAPLES:
      return config.minimumCharge_naples;
    case MarketArea.LUXURY_NAPLES:
      return config.minimumCharge_luxuryNaples;
  }
}

// ─── Step 20: Round to Nearest $25 ──────────────────────────────────────────

export function roundToNearest25(price: number): number {
  return Math.round(price / 25) * 25;
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export function calculateEstimate(inputs: PricingInputs): PricingBreakdown {
  const { config } = inputs;

  // Step 1–5: Labor hour components
  const baseHours = getBaseHours(inputs.squareFootage);
  const bathroomHours = getBathroomHours(inputs.bathrooms);
  const bedroomHours = getBedroomHours(inputs.bedrooms);
  const petHours = getPetHours(inputs.petLevel);
  const featureHours = getFeatureHours(inputs);

  // Step 6: Total labor hours
  const totalLaborHours =
    baseHours + bathroomHours + bedroomHours + petHours + featureHours;

  // Step 7–10: Multipliers
  const occupancyMultiplier = getOccupancyMultiplier(inputs.occupancy);
  const flooringMultiplier = getFlooringMultiplier(inputs.flooringType);
  const conditionMultiplier = getConditionMultiplier(inputs.condition);
  const firstTimeMultiplier = getFirstTimeMultiplier(inputs.firstTimeType);

  // Step 11: Production hours
  const productionHours =
    totalLaborHours *
    occupancyMultiplier *
    flooringMultiplier *
    conditionMultiplier *
    firstTimeMultiplier;

  // Step 12–13: Rates
  const hourlyRate = getHourlyRate(inputs.marketArea, config);
  const frequencyMultiplier = getFrequencyMultiplier(inputs.frequency, config);

  // Step 14: Seasonal
  const seasonalMultiplier = getSeasonalMultiplier(
    config,
    inputs.seasonalOverride
  );

  // Step 15: Base price
  const basePrice =
    productionHours * hourlyRate * frequencyMultiplier * seasonalMultiplier;

  // Step 16: Travel fee
  const travelFee = getTravelFee(inputs.distanceMiles, config);

  // Step 17: Add-ons
  const addOnBreakdown = calculateAddOns(inputs.addOns, config);
  const addOnTotal = addOnBreakdown.reduce((sum, a) => sum + a.totalPrice, 0);

  // Step 18: Raw final price
  const effectiveTravelFee = travelFee === -1 ? 0 : travelFee;
  const rawFinalPrice = basePrice + effectiveTravelFee + addOnTotal;

  // Step 19: Minimum charge
  const minimumCharge = getMinimumCharge(inputs.marketArea, config);
  const finalPriceAfterMinimum = Math.max(rawFinalPrice, minimumCharge);

  // Step 20: Round
  const roundedPrice = roundToNearest25(finalPriceAfterMinimum);

  return {
    baseHours,
    bathroomHours,
    bedroomHours,
    petHours,
    featureHours,
    totalLaborHours,
    occupancyMultiplier,
    flooringMultiplier,
    conditionMultiplier,
    firstTimeMultiplier,
    productionHours,
    hourlyRate,
    frequencyMultiplier,
    seasonalMultiplier,
    basePrice,
    travelFee: effectiveTravelFee,
    addOnBreakdown,
    addOnTotal,
    rawFinalPrice,
    minimumCharge,
    finalPriceAfterMinimum,
    roundedPrice,
  };
}

// ─── Default config (fallback before DB load) ─────────────────────────────────

export const DEFAULT_PRICING_CONFIG: PricingConfigMap = {
  hourlyRate_fortMyers: 70,
  hourlyRate_naples: 85,
  hourlyRate_luxuryNaples: 100,
  minimumCharge_fortMyers: 175,
  minimumCharge_naples: 225,
  minimumCharge_luxuryNaples: 300,
  frequencyMultiplier_weekly: 0.9,
  frequencyMultiplier_biweekly: 1.0,
  frequencyMultiplier_monthly: 1.2,
  frequencyMultiplier_oneTime: 1.35,
  frequencyMultiplier_deepClean: 1.75,
  travelFee_0_10: 0,
  travelFee_10_20: 25,
  travelFee_20_30: 50,
  addon_oven: 50,
  addon_refrigerator: 50,
  addon_interiorWindows: 8,
  addon_baseboards: 75,
  addon_ceilingFans: 5,
  addon_insideCabinets: 100,
  addon_laundry: 50,
  addon_linens: 25,
  seasonalMultiplier_high: 1.1,
  seasonalMultiplier_low: 1.0,
};

// ─── DB config parser ─────────────────────────────────────────────────────────

export function parsePricingConfig(
  rows: Array<{ key: string; value: string }>
): PricingConfigMap {
  const map: Partial<PricingConfigMap> = {};
  for (const row of rows) {
    (map as Record<string, number>)[row.key] = parseFloat(row.value);
  }
  return { ...DEFAULT_PRICING_CONFIG, ...map };
}

// ─── Label helpers ────────────────────────────────────────────────────────────

export const FREQUENCY_LABELS: Record<ServiceFrequency, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-Weekly",
  MONTHLY: "Monthly",
  ONE_TIME: "One-Time",
  DEEP_CLEAN: "Deep Clean",
};

export const MARKET_LABELS: Record<MarketArea, string> = {
  FORT_MYERS: "Fort Myers",
  NAPLES: "Naples",
  LUXURY_NAPLES: "Luxury Naples",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  APPROVED: "Approved",
  CONVERTED: "Converted",
  EXPIRED: "Expired",
};

export const CITY_TO_MARKET: Record<string, MarketArea> = {
  "Fort Myers": MarketArea.FORT_MYERS,
  "Cape Coral": MarketArea.FORT_MYERS,
  "Bonita Springs": MarketArea.FORT_MYERS,
  Estero: MarketArea.FORT_MYERS,
  Naples: MarketArea.NAPLES,
  "Marco Island": MarketArea.NAPLES,
  "Port Royal": MarketArea.LUXURY_NAPLES,
  "Pelican Bay": MarketArea.LUXURY_NAPLES,
  "Aqualane Shores": MarketArea.LUXURY_NAPLES,
};

export const SWFL_CITIES = [
  "Fort Myers",
  "Cape Coral",
  "Bonita Springs",
  "Estero",
  "Naples",
  "Marco Island",
  "Port Royal",
  "Pelican Bay",
  "Lehigh Acres",
  "San Carlos Park",
  "Golden Gate",
];
