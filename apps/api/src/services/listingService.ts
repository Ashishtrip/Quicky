import { prisma } from '../db/prisma';

export const getStoreListings = async (storeId: string) => {
  let actualStoreId = storeId;

  return await prisma.listing.findMany({
    where: { storeId: actualStoreId },
    include: {
      catalogItem: true,
    }
  });
};

export const upsertListing = async (
  storeId: string, 
  catalogItemId: string, 
  data: {
    price?: number;
    stockQuantity: number;
    expiryBucket: string;
    isCustom?: boolean;
    name?: string;
    unit?: string;
    imageUrl?: string;
    categoryId?: string;
  }
) => {
  let actualStoreId = storeId;

  // Auto-heal missing store (common in local dev when DB is wiped but Firebase Auth persists)
  const storeExists = await prisma.store.findUnique({ where: { id: actualStoreId } });
  if (!storeExists) {
    const newStore = await prisma.store.create({
      data: {
        id: actualStoreId,
        name: 'Quicky Store (Auto-healed)',
        address: 'Rohini, New Delhi',
        latitude: 28.7495,
        longitude: 77.0565,
        phone: '9876543210',
        ownerName: 'Partner',
        ownerPhone: '9876543210',
        isActive: true,
        isOpen: true,
      }
    });
    try {
      const { redis } = require('../utils/redis');
      await redis.geoadd('quicky:stores:locations', newStore.longitude, newStore.latitude, newStore.id);
    } catch (e) {
      console.warn('Failed to add auto-healed store to Redis geo-index', e);
    }
  }

  let finalPrice: number = 0;
  let basePrice: number = data.price || 0;

  if (data.isCustom && data.name) {
    let category;
    if (data.categoryId) {
      category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    }
    if (!category) {
      category = await prisma.category.findFirst({ where: { name: 'Custom' } });
    }
    if (!category) {
       category = await prisma.category.create({
          data: { name: 'Custom', useTodayDiscountPct: 25, sortOrder: 999 }
       });
    }

    await prisma.catalogItem.upsert({
      where: { id: catalogItemId },
      update: {
        name: data.name,
        unit: data.unit || '1 unit',
        imageUrl: data.imageUrl,
        referenceMrp: data.price,
        storeId: actualStoreId
      },
      create: {
        id: catalogItemId,
        name: data.name,
        unit: data.unit || '1 unit',
        imageUrl: data.imageUrl,
        referenceMrp: data.price,
        categoryId: category.id,
        storeId: actualStoreId
      }
    });
  }

  const item = await prisma.catalogItem.findUnique({
    where: { id: catalogItemId },
    include: { category: true }
  });

  if (!item) throw new Error('Catalog item not found');

  if (!basePrice) {
    basePrice = item.referenceMrp || 0;
  }

  if (data.expiryBucket === 'USE_TODAY') {
    finalPrice = basePrice * 0.75;
  } else {
    finalPrice = basePrice;
  }

  return await prisma.listing.upsert({
    where: {
      storeId_catalogItemId: {
        storeId: actualStoreId,
        catalogItemId,
      }
    },
    update: {
      price: finalPrice,
      stockQuantity: data.stockQuantity,
      expiryBucket: data.expiryBucket,
      lastConfirmedAt: new Date(),
    },
    create: {
      storeId: actualStoreId,
      catalogItemId,
      price: finalPrice,
      stockQuantity: data.stockQuantity,
      expiryBucket: data.expiryBucket,
      lastConfirmedAt: new Date(),
    }
  });
};

export const deleteListing = async (storeId: string, listingId: string) => {
  let actualStoreId = storeId;

  // Ensure the listing belongs to the store
  const listing = await prisma.listing.findUnique({
    where: { id: listingId }
  });

  if (!listing || listing.storeId !== actualStoreId) {
    throw new Error('Listing not found or unauthorized');
  }

  return await prisma.listing.delete({
    where: { id: listingId }
  });
};
