import { z } from 'zod';
import { CategoryId, brand } from './branded-ids';

/**
 * Pilot economics configuration - all tunable without redeploy per PRD §1.4
 * Source of truth: Postgres `config` table, synced to this schema at startup
 */

/**
 * Delivery fee configuration
 */
export const DeliveryFeeConfigSchema = z.object({
  // Flat fee per order in INR (pilot default: 15-25)
  flatFeeInr: z.number().int().nonnegative().default(20),
  // Free delivery threshold in INR (pilot default: 349)
  freeDeliveryThresholdInr: z.number().int().positive().default(349),
  // Whether delivery fee is active
  isActive: z.boolean().default(true),
});

export type DeliveryFeeConfig = z.infer<typeof DeliveryFeeConfigSchema>;

/**
 * Commission configuration
 */
export const CommissionConfigSchema = z.object({
  // Platform commission percentage (pilot default: 10-15%)
  commissionPct: z.number().min(0).max(100).default(12),
  // Whether commission is active
  isActive: z.boolean().default(true),
});

export type CommissionConfig = z.infer<typeof CommissionConfigSchema>;

/**
 * Category discount band for "Use Today" items
 * Set by ops per category, applied automatically when item tagged USE_TODAY
 * Store owners CANNOT override in v1 per PRD §6.2
 */
export const CategoryDiscountBandSchema = z.object({
  id: z.string().brand<CategoryId>(),
  categoryId: z.string().brand<CategoryId>(),
  categoryName: z.string(),
  // Discount percentage for USE_TODAY items in this category
  // Starting points per PRD: bread/baked 25%, dairy 15-20%, snacks 20%, staples 10%, beverages 20-25%
  discountPct: z.number().min(0).max(100),
  // Whether this band is active
  isActive: z.boolean().default(true),
  // When this band was last updated by ops
  updatedAt: z.date(),
  // Ops user who last updated
  updatedBy: z.string().optional(),
});

export type CategoryDiscountBand = z.infer<typeof CategoryDiscountBandSchema>;

/**
 * Staleness configuration for listings
 */
export const StalenessConfigSchema = z.object({
  // Hours after lastConfirmedAt before listing is flagged unverified (PRD: 48h)
  stalenessHours: z.number().int().positive().default(48),
  // Whether staleness check is active
  isActive: z.boolean().default(true),
});

export type StalenessConfig = z.infer<typeof StalenessConfigSchema>;

/**
 * Delivery radius configuration (per store, set at onboarding)
 */
export const DeliveryRadiusConfigSchema = z.object({
  storeId: z.string(),
  // Radius in km (pilot: 2-3 km)
  radiusKm: z.number().positive().default(3),
  // Whether delivery is active for this store
  isActive: z.boolean().default(true),
});

export type DeliveryRadiusConfig = z.infer<typeof DeliveryRadiusConfigSchema>;

/**
 * COD configuration
 */
export const CodConfigSchema = z.object({
  // Whether COD is enabled (never gate behind v2 per PRD)
  enabled: z.boolean().default(true),
  // Maximum COD order value in INR (optional cap)
  maxOrderValueInr: z.number().int().positive().optional(),
  // Additional COD handling fee in INR (optional)
  handlingFeeInr: z.number().int().nonnegative().default(0),
});

export type CodConfig = z.infer<typeof CodConfigSchema>;

/**
 * Pilot economics snapshot for weekly P&L review
 * Computed per order, stored for aggregation
 */
export const OrderEconomicsSchema = z.object({
  orderId: z.string(),
  storeId: z.string(),
  customerId: z.string(),
  // Revenue
  subtotal: z.number().positive(),
  discountTotal: z.number().nonnegative(),
  deliveryFeeCharged: z.number().nonnegative(),
  deliveryFeeWaived: z.boolean(),
  commissionPct: z.number().min(0).max(100),
  commissionAmount: z.number().nonnegative(),
  // Costs
  estimatedDeliveryCostInr: z.number().nonnegative(),
  // Net
  platformRevenue: z.number(), // commissionAmount + deliveryFeeCharged - estimatedDeliveryCostInr
  // Metadata
  computedAt: z.date(),
});

export type OrderEconomics = z.infer<typeof OrderEconomicsSchema>;

/**
 * Complete pilot config object (for bootstrapping / admin UI)
 */
export const PilotConfigSchema = z.object({
  deliveryFee: DeliveryFeeConfigSchema,
  commission: CommissionConfigSchema,
  staleness: StalenessConfigSchema,
  cod: CodConfigSchema,
  categoryDiscountBands: z.array(CategoryDiscountBandSchema),
  deliveryRadii: z.array(DeliveryRadiusConfigSchema),
  // Pilot metadata
  pilotName: z.string().default('Rohini Pilot'),
  pilotStartDate: z.date(),
  pilotEndDate: z.date().optional(),
  isActive: z.boolean().default(true),
});

export type PilotConfig = z.infer<typeof PilotConfigSchema>;

/**
 * Config keys for database storage
 */
export const CONFIG_KEYS = {
  DELIVERY_FEE: 'delivery_fee',
  COMMISSION: 'commission',
  STALENESS: 'staleness',
  COD: 'cod',
  CATEGORY_DISCOUNT_BANDS: 'category_discount_bands',
  DELIVERY_RADII: 'delivery_radii',
  PILOT_META: 'pilot_meta',
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];