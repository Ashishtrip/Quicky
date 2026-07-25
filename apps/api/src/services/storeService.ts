import { redis } from '../utils/redis';
import { prisma } from '../db/prisma';

export const getNearbyStores = async (latitude: number, longitude: number, maxRadiusKm: number = 3) => {
  // Query Redis for stores within a generous max radius first
  const nearbyStoreIds = await redis.geosearch(
    'quicky:stores:locations',
    'FROMLONLAT', longitude, latitude,
    'BYRADIUS', maxRadiusKm, 'km', 
    'ASC',
    'WITHDIST'
  ) as unknown as [string, string][]; // [storeId, distance_in_km]

  if (!nearbyStoreIds || nearbyStoreIds.length === 0) {
    return [];
  }

  const storeIdMap = new Map<string, number>();
  const storeIds = nearbyStoreIds.map(([id, distanceStr]) => {
    storeIdMap.set(id, parseFloat(distanceStr));
    return id;
  });

  // Fetch full store details from Prisma
  const stores = await prisma.store.findMany({
    where: {
      id: { in: storeIds },
      isOpen: true
    }
  });

  // Filter based on store's specific deliveryRadius (converted from meters to km)
  // and sort by distance
  const validStores = stores
    .map(store => {
      const distanceKm = storeIdMap.get(store.id) || 0;
      return {
        ...store,
        distanceKm
      };
    })
    .filter(store => {
      const storeRadiusKm = store.deliveryRadiusKm || 3;
      // We cap the store radius at 3km even if they set it higher, per user instructions
      const effectiveRadiusKm = Math.min(storeRadiusKm, 3);
      return store.distanceKm <= effectiveRadiusKm;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return validStores;
};

export const updateStoreProfile = async (
  storeId: string, 
  data: { 
    isOpen?: boolean; 
    deliveryRadius?: number; 
    latitude?: number; 
    longitude?: number; 
    name?: string; 
    address?: string;
    phone?: string;
    ownerName?: string;
    ownerPhone?: string;
    contactEmail?: string;
    contactPhone?: string;
    gstNumber?: string;
    fcmToken?: string;
  }
) => {
  const updateData: any = {
    isOpen: data.isOpen,
    latitude: data.latitude,
    longitude: data.longitude,
    name: data.name,
    address: data.address,
    phone: data.phone,
    ownerName: data.ownerName,
    ownerPhone: data.ownerPhone,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    gstNumber: data.gstNumber,
    fcmToken: data.fcmToken,
  };
  
  if (data.deliveryRadius !== undefined) {
    updateData.deliveryRadiusKm = data.deliveryRadius / 1000;
  }

  // Remove undefined values
  Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

  if (Object.keys(updateData).length === 0) {
    return prisma.store.findUnique({ where: { id: storeId } });
  }

  const store = await prisma.store.upsert({
    where: { id: storeId },
    create: {
      id: storeId,
      name: updateData.name || 'Store Partner',
      address: updateData.address || 'Unknown Address',
      // Default to Rohini pilot coordinates — (0, 0) is Gulf of Guinea,
      // which fails the 3km haversine check from any Delhi customer.
      latitude: updateData.latitude || 28.7495,
      longitude: updateData.longitude || 77.0565,
      phone: updateData.phone || updateData.ownerPhone || updateData.contactPhone || '0000000000',
      ownerName: updateData.ownerName || 'Unknown',
      ownerPhone: updateData.ownerPhone || updateData.phone || updateData.contactPhone || '0000000000',
      isOpen: updateData.isOpen || false,
      deliveryRadiusKm: updateData.deliveryRadiusKm || 2.5,
      contactEmail: updateData.contactEmail,
      contactPhone: updateData.contactPhone,
      gstNumber: updateData.gstNumber,
      fcmToken: updateData.fcmToken,
    },
    update: updateData
  });

  if (store.latitude && store.longitude) {
    try {
      if (store.isOpen) {
        await redis.geoadd('quicky:stores:locations', store.longitude, store.latitude, store.id);
      } else {
        await redis.zrem('quicky:stores:locations', store.id);
      }
    } catch (error) {
      console.warn(`[Redis] Failed to update location for store ${store.id}. Is Redis running?`, error);
    }
  }

  return store;
};
