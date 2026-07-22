/**
 * Sync store locations from Postgres → Redis geo-index.
 * 
 * Run once after Postgres is up to backfill the Redis geo-index
 * so that getNearbyStores() and productService can discover stores.
 * 
 * Usage:  npx ts-node scripts/sync-store-locations.ts
 */
import { prisma } from '../src/db/prisma';
import { redis } from '../src/utils/redis';

async function syncStoreLocations() {
  console.log('[sync] Reading active stores from Postgres...');

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      isOpen: true,
    },
  });

  console.log(`[sync] Found ${stores.length} active stores.`);

  let synced = 0;
  let skipped = 0;

  for (const store of stores) {
    // Skip stores with zero/default coordinates
    if (!store.latitude || !store.longitude) {
      console.log(`  ⏭  ${store.name} (${store.id}) — no coordinates, skipping`);
      skipped++;
      continue;
    }

    if (!store.isOpen) {
      // Remove closed stores from the geo-index
      await redis.zrem('quicky:stores:locations', store.id);
      console.log(`  🔴 ${store.name} (${store.id}) — closed, removed from geo-index`);
      skipped++;
      continue;
    }

    await redis.geoadd(
      'quicky:stores:locations',
      store.longitude,
      store.latitude,
      store.id
    );
    console.log(`  ✅ ${store.name} (${store.id}) — synced at (${store.latitude}, ${store.longitude})`);
    synced++;
  }

  console.log(`\n[sync] Done. Synced: ${synced}, Skipped: ${skipped}`);

  // Verify the geo-index
  const count = await redis.zcard('quicky:stores:locations');
  console.log(`[sync] Redis geo-index 'quicky:stores:locations' now has ${count} entries.`);

  await redis.quit();
  await prisma.$disconnect();
}

syncStoreLocations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[sync] FATAL:', err);
    process.exit(1);
  });
