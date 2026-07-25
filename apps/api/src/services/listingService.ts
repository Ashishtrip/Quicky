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
  }
) => {
  let actualStoreId = storeId;

  let finalPrice: number = 0;
  let basePrice: number = data.price || 0;

  if (data.isCustom && data.name) {
    let category = await prisma.category.findFirst();
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
