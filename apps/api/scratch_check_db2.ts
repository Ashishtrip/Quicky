import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    include: {
      store: true,
      catalogItem: true
    }
  });

  console.log("Listings:", JSON.stringify(listings, null, 2));
  
  const stores = await prisma.store.findMany();
  console.log("Stores:", JSON.stringify(stores, null, 2));

  // Compute distance for all stores to Rohini
  const ROHINI_LAT = 28.7495;
  const ROHINI_LNG = 77.0565;

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  for (const store of stores) {
    const dist = haversineKm(ROHINI_LAT, ROHINI_LNG, store.latitude, store.longitude);
    console.log(`Store ${store.id} distance to Rohini: ${dist} km. IsActive: ${store.isActive}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
