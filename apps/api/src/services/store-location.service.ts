import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../utils/redis';

// Define the queue
export const storeLocationQueue = new Queue('store-location-queue', {
  connection: redis as any,
});

export interface StoreLocationData {
  storeId: string;
  latitude: number;
  longitude: number;
}

// Define the worker
export const storeLocationWorker = new Worker(
  'store-location-queue',
  async (job: Job) => {
    const data = job.data as StoreLocationData;
    
    // Add store location to the Redis Geo Index 'quicky:stores:locations'
    // ioredis geoadd arguments: key, longitude, latitude, member
    await redis.geoadd(
      'quicky:stores:locations',
      data.longitude,
      data.latitude,
      data.storeId
    );

    // Optional: We can add a separate key to track the last updated time
    // to implement a TTL for stale stores.
    await redis.set(`quicky:stores:last_seen:${data.storeId}`, Date.now(), 'EX', 3600); // 1 hour TTL
  },
  {
    connection: redis as any,
  }
);

storeLocationWorker.on('completed', (job: Job) => {
  console.log(`[Store Location Worker] Processed location update for store ${job.data.storeId}`);
});

storeLocationWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Store Location Worker] Job failed:`, err);
});
