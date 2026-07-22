import { z } from 'zod';
import { StoreId, ListingId, CatalogItemId, DeliveryPartnerId, brand } from './branded-ids';

/**
 * Store / kirana partner
 */
export const StoreSchema = z.object({
  id: z.string().brand<StoreId>(),
  name: z.string().min(1),
  nameHindi: z.string().optional(),
  description: z.string().optional(),
  // Location for proximity/delivery radius
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  // Delivery radius in km (configured by ops at onboarding, default 2.5)
  deliveryRadiusKm: z.number().positive().default(2.5),
  // Address for display
  address: z.string(),
  addressHindi: z.string().optional(),
  // Contact
  phone: z.string().min(10),
  ownerName: z.string().min(1),
  ownerPhone: z.string().min(10),
  // Store image
  imageUrl: z.string().url().optional(),
  // Rating (seeded manually pre-launch, then from orders)
  rating: z.number().min(0).max(5).default(0),
  totalRatings: z.number().int().nonnegative().default(0),
  // Status
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false), // Completed onboarding training
  // Commission rate for this store (10-15%, config-driven)
  commissionPct: z.number().min(0).max(100).default(12),
  // Delivery fee settings (can override global config)
  deliveryFee: z.number().nonnegative().optional(),
  freeDeliveryThreshold: z.number().nonnegative().optional(),
  // FCM token for push notifications
  fcmToken: z.string().optional(),
  // Onboarding
  onboardingCompletedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Store = z.infer<typeof StoreSchema>;

/**
 * Store profile as shown to customers
 */
export const StoreProfileSchema = z.object({
  id: z.string().brand<StoreId>(),
  name: z.string(),
  nameHindi: z.string().optional(),
  imageUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5),
  totalRatings: z.number().int().nonnegative(),
  distanceKm: z.number().optional(),
  isVerified: z.boolean(),
  deliveryFee: z.number().nonnegative(),
  freeDeliveryThreshold: z.number().nonnegative(),
  estimatedDeliveryMinutes: z.number().int().positive(),
});

export type StoreProfile = z.infer<typeof StoreProfileSchema>;

/**
 * Store listing - product × store combination with store-specific data
 */
export const ListingSchema = z.object({
  id: z.string().brand<ListingId>(),
  storeId: z.string().brand<StoreId>(),
  catalogItemId: z.string().brand<CatalogItemId>(),
  // Store's listed price (MRP or selling price)
  price: z.number().positive(),
  // Current stock quantity
  stockQuantity: z.number().int().nonnegative(),
  // Expiry bucket - exactly two values in MVP
  expiryBucket: z.enum(['USE_TODAY', 'FRESH_STOCK']),
  // Optional manufacturing date (for amber "Soon" calculation)
  manufacturingDate: z.date().optional(),
  // Last time store owner confirmed this listing
  lastConfirmedAt: z.date(),
  // Auto-flagged after 48h without re-confirmation
  isUnverified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Listing = z.infer<typeof ListingSchema>;

/**
 * Input for creating/updating a listing (store-side tagging flow)
 */
export const ListingTagInputSchema = z.object({
  catalogItemId: z.string().brand<CatalogItemId>(),
  price: z.number().positive(),
  stockQuantity: z.number().int().nonnegative(),
  expiryBucket: z.enum(['USE_TODAY', 'FRESH_STOCK']),
  manufacturingDate: z.date().optional(),
});

export type ListingTagInput = z.infer<typeof ListingTagInputSchema>;