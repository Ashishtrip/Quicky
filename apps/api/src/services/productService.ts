import { prisma } from '../db/prisma';
import { computeFreshnessMeter } from '@quicky/shared-types';
import { haversineKm, calculateDiscountedPrice } from '../utils/math';
export interface ProductQueryParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  freshness?: 'USE_TODAY' | 'FRESH_STOCK' | 'ANY';
  categoryId?: string;
  search?: string;
}

export interface AggregatedProductResult {
  catalogItem: {
    id: string;
    name: string;
    nameHindi: string | null;
    description: string | null;
    unit: string;
    imageUrl: string | null;
    referenceMrp: number | null;
    barcode: string | null;
    tags: string[];
  };
  category: {
    id: string;
    name: string;
    nameHindi: string | null;
    useTodayDiscountPct: number;
  };
  expiryBucket: string;
  price: number;
  discountedPrice: number | null;
  discountPct: number | null;
  freshnessMeter: 'GREEN' | 'AMBER' | 'RED';
  totalStockQuantity: number;
}

/**
 * Fetch products near a customer location with optional filters.
 * Aggregates stock across all nearby stores to hide store identity.
 */
export async function getProducts(params: ProductQueryParams): Promise<AggregatedProductResult[]> {
  const {
    lat,
    lng,
    radiusKm = 3,
    freshness = 'ANY',
    categoryId,
    search,
  } = params;

  const listingWhere: Record<string, unknown> = {
    isActive: true,
    stockQuantity: { gt: 0 },
    store: { isActive: true, isOpen: true },
    catalogItem: { isActive: true },
  };

  if (freshness === 'USE_TODAY') {
    listingWhere['expiryBucket'] = 'USE_TODAY';
  } else if (freshness === 'FRESH_STOCK') {
    listingWhere['expiryBucket'] = 'FRESH_STOCK';
  }

  if (categoryId) {
    listingWhere['catalogItem'] = {
      ...(listingWhere['catalogItem'] as Record<string, unknown>),
      categoryId,
    };
  }

  if (search) {
    listingWhere['catalogItem'] = {
      ...(listingWhere['catalogItem'] as Record<string, unknown>),
      name: { contains: search, mode: 'insensitive' },
    };
  }

  const listings = await prisma.listing.findMany({
    where: listingWhere,
    include: {
      store: true,
      catalogItem: {
        include: {
          category: true,
        },
      },
    },
  });

  const productMap = new Map<string, AggregatedProductResult>();

  for (const listing of listings) {
    const store = listing.store;
    const distanceKm = haversineKm(lat, lng, store.latitude, store.longitude);

    if (distanceKm > radiusKm) continue;

    const catalogItem = listing.catalogItem;
    const category = catalogItem.category;
    const key = `${catalogItem.id}_${listing.expiryBucket}`;

    if (productMap.has(key)) {
      const existing = productMap.get(key)!;
      existing.totalStockQuantity += listing.stockQuantity;
    } else {
      const freshnessMeter = computeFreshnessMeter({
        expiryBucket: listing.expiryBucket as 'USE_TODAY' | 'FRESH_STOCK',
        manufacturingDate: listing.manufacturingDate ?? undefined,
        categoryEstimatedShelfLifeDays: category.estimatedShelfLifeDays ?? undefined,
      });

      let discountedPrice: number | null = null;
      let discountPct: number | null = null;

      if (listing.expiryBucket === 'USE_TODAY' && category.useTodayDiscountPct > 0) {
        discountPct = category.useTodayDiscountPct;
        discountedPrice = calculateDiscountedPrice(listing.price, category.useTodayDiscountPct);
      }

      productMap.set(key, {
        catalogItem: {
          id: catalogItem.id,
          name: catalogItem.name,
          nameHindi: catalogItem.nameHindi,
          description: catalogItem.description,
          unit: catalogItem.unit,
          imageUrl: catalogItem.imageUrl,
          referenceMrp: catalogItem.referenceMrp,
          barcode: catalogItem.barcode,
          tags: catalogItem.tags,
        },
        category: {
          id: category.id,
          name: category.name,
          nameHindi: category.nameHindi,
          useTodayDiscountPct: category.useTodayDiscountPct,
        },
        expiryBucket: listing.expiryBucket,
        price: listing.price,
        discountedPrice,
        discountPct,
        freshnessMeter,
        totalStockQuantity: listing.stockQuantity,
      });
    }
  }

  return Array.from(productMap.values());
}

/**
 * Fetch all active categories sorted by sortOrder
 */
export async function getCategories() {
  return await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      nameHindi: true,
      description: true,
      useTodayDiscountPct: true,
      estimatedShelfLifeDays: true,
      sortOrder: true,
    },
  });
}
