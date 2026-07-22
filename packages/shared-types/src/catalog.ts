import { z } from 'zod';
import { CategoryId, CatalogItemId, StoreId, ListingId, brand } from './branded-ids';
import { ExpiryBucketSchema, FreshnessMeterStateSchema } from './expiry';

/**
 * Category of products - determines discount band for Use Today items
 */
export const CategorySchema = z.object({
  id: z.string().brand<CategoryId>(),
  name: z.string().min(1),
  nameHindi: z.string().optional(),
  description: z.string().optional(),
  // Discount band for "Use Today" items in this category (percentage)
  useTodayDiscountPct: z.number().min(0).max(100),
  // Estimated shelf life in days for amber "Soon" Freshness Meter calculation
  estimatedShelfLifeDays: z.number().int().positive().optional(),
  // Sort order for display
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Category = z.infer<typeof CategorySchema>;

/**
 * Master catalog item - maintained by ops in Google Sheet/Notion
 * Store owners select from this catalog, they don't create products
 */
export const CatalogItemSchema = z.object({
  id: z.string().brand<CatalogItemId>(),
  categoryId: z.string().brand<CategoryId>(),
  name: z.string().min(1),
  nameHindi: z.string().optional(),
  description: z.string().optional(),
  // Standard unit (e.g., "500g", "1L", "12 pieces", "1 kg")
  unit: z.string().min(1),
  // Image URL from Cloudflare R2
  imageUrl: z.string().url().optional(),
  // MRP reference price (not enforced, used for display/comparison)
  referenceMrp: z.number().positive().optional(),
  // Barcode/EAN if available (for future barcode scanning)
  barcode: z.string().optional(),
  // Tags for search/filtering
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CatalogItem = z.infer<typeof CatalogItemSchema>;

/**
 * Product as seen by customer - combines catalog item with store-specific listing
 */
export const ProductSchema = z.object({
  catalogItem: CatalogItemSchema,
  category: CategorySchema,
  store: z.object({
    id: z.string().brand<StoreId>(),
    name: z.string(),
    distanceKm: z.number().optional(),
    rating: z.number().min(0).max(5).optional(),
  }),
  // Store-specific listing details
  listing: z.object({
    id: z.string().brand<ListingId>(),
    price: z.number().positive(), // Store's listed price (MRP or selling price)
    stockQuantity: z.number().int().nonnegative(),
    expiryBucket: ExpiryBucketSchema,
    manufacturingDate: z.date().optional(),
    lastConfirmedAt: z.date(),
    isUnverified: z.boolean(),
  }),
  // Computed fields for display
  discountedPrice: z.number().positive().optional(), // Price after Use Today discount
  discountPct: z.number().min(0).max(100).optional(),
  freshnessMeter: FreshnessMeterStateSchema,
});

export type Product = z.infer<typeof ProductSchema>;