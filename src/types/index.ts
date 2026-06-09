import {
  EstimateStatus,
  ServiceFrequency,
  OccupancyType,
  FlooringType,
  ConditionType,
  FirstTimeType,
  PetLevel,
  MarketArea,
  UserRole,
} from "@prisma/client";

export type {
  EstimateStatus,
  ServiceFrequency,
  OccupancyType,
  FlooringType,
  ConditionType,
  FirstTimeType,
  PetLevel,
  MarketArea,
  UserRole,
};

// ─── Pricing Engine Types ───────────────────────────────────────────────────

export interface AddOnInput {
  key: string;
  quantity: number;
}

export interface AddOnResult {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PricingConfigMap {
  // Hourly rates
  hourlyRate_fortMyers: number;
  hourlyRate_naples: number;
  hourlyRate_luxuryNaples: number;

  // Minimum charges
  minimumCharge_fortMyers: number;
  minimumCharge_naples: number;
  minimumCharge_luxuryNaples: number;

  // Frequency multipliers
  frequencyMultiplier_weekly: number;
  frequencyMultiplier_biweekly: number;
  frequencyMultiplier_monthly: number;
  frequencyMultiplier_oneTime: number;
  frequencyMultiplier_deepClean: number;

  // Travel fees
  travelFee_0_10: number;
  travelFee_10_20: number;
  travelFee_20_30: number;

  // Add-on pricing
  addon_oven: number;
  addon_refrigerator: number;
  addon_interiorWindows: number;
  addon_baseboards: number;
  addon_ceilingFans: number;
  addon_insideCabinets: number;
  addon_laundry: number;
  addon_linens: number;

  // Seasonal
  seasonalMultiplier_high: number; // Nov–Apr
  seasonalMultiplier_low: number; // May–Oct
}

export interface PricingInputs {
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  petLevel: PetLevel;
  hasStairs: boolean;
  hasElevator: boolean;
  hasHomeOffice: boolean;
  hasGym: boolean;
  hasTheaterRoom: boolean;
  hasLanai: boolean;
  hasPoolBath: boolean;
  occupancy: OccupancyType;
  flooringType: FlooringType;
  condition: ConditionType;
  firstTimeType: FirstTimeType;
  frequency: ServiceFrequency;
  marketArea: MarketArea;
  distanceMiles: number;
  addOns: AddOnInput[];
  seasonalOverride?: number | null;
  config: PricingConfigMap;
}

export interface PricingBreakdown {
  // Step 1–6: Labor hours
  baseHours: number;
  bathroomHours: number;
  bedroomHours: number;
  petHours: number;
  featureHours: number;
  totalLaborHours: number;

  // Step 7–10: Multipliers
  occupancyMultiplier: number;
  flooringMultiplier: number;
  conditionMultiplier: number;
  firstTimeMultiplier: number;

  // Step 11: Production hours
  productionHours: number;

  // Step 12–15: Pricing
  hourlyRate: number;
  frequencyMultiplier: number;
  seasonalMultiplier: number;
  basePrice: number;

  // Step 16: Travel
  travelFee: number;

  // Step 17–18: Add-ons
  addOnBreakdown: AddOnResult[];
  addOnTotal: number;
  rawFinalPrice: number;

  // Step 19: Minimum
  minimumCharge: number;
  finalPriceAfterMinimum: number;

  // Step 20: Rounded
  roundedPrice: number;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export interface KpiData {
  estimatesToday: number;
  estimatesThisMonth: number;
  totalEstimatedRevenue: number;
  conversionRate: number;
  averageTicketValue: number;
  estimatesTodayChange: number;
  estimatesMonthChange: number;
  revenueChange: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export interface EstimatesByFrequency {
  frequency: string;
  count: number;
}

export interface EstimatesByCity {
  city: string;
  count: number;
  revenue: number;
}

export interface ActivityItem {
  id: string;
  type: "estimate" | "customer" | "job";
  description: string;
  createdAt: string;
  user?: string;
}

// ─── Customer Types ───────────────────────────────────────────────────────────

export interface CustomerWithEstimates {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  notes: string | null;
  _count: { estimates: number };
  estimates?: EstimateSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface EstimateSummary {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  frequency: ServiceFrequency;
  roundedPrice: number;
  city: string;
  createdAt: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface EstimateFormData {
  // Step 1: Customer
  customerId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip: string;

  // Step 2: Property
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  propertyCity: string;
  propertyType: string;

  // Step 3: Conditions
  occupancy: OccupancyType;
  flooringType: FlooringType;
  condition: ConditionType;
  petLevel: PetLevel;

  // Step 4: Features
  hasStairs: boolean;
  hasElevator: boolean;
  hasHomeOffice: boolean;
  hasGym: boolean;
  hasTheaterRoom: boolean;
  hasLanai: boolean;
  hasPoolBath: boolean;

  // Step 5: Service
  frequency: ServiceFrequency;
  firstTimeType: FirstTimeType;
  marketArea: MarketArea;
  distanceMiles: number;
  seasonalOverride?: number | null;

  // Step 6: Add-ons
  addOns: AddOnInput[];

  // Metadata
  expiresAt?: string;
  notes?: string;
  internalNotes?: string;
}

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface ReportFilters {
  startDate: string;
  endDate: string;
  city?: string;
  status?: EstimateStatus;
  frequency?: ServiceFrequency;
}

export interface ReportRow {
  id: string;
  estimateNumber: string;
  customerName: string;
  city: string;
  frequency: string;
  status: string;
  roundedPrice: number;
  createdAt: string;
}
