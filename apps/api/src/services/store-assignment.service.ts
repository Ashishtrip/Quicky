import { Queue, Worker, Job } from 'bullmq';
import { redis, redlock } from '../utils/redis';
import { prisma } from '../db/prisma';
import { messaging } from '../utils/firebase';

export const storeAssignmentQueue = new Queue('store-assignment-queue', {
  connection: redis as any,
});

export interface StoreAssignmentData {
  orderId: string;
  latitude: number;
  longitude: number;
  attempt: number;
  ignoredStoreIds: string[];
}

export const storeAssignmentWorker = new Worker(
  'store-assignment-queue',
  async (job: Job) => {
    const data = job.data as StoreAssignmentData;
    const { orderId, latitude, longitude, attempt, ignoredStoreIds } = data;

    // 1. Check if Order is still PENDING
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== 'PENDING') {
      console.log(`Order ${orderId} is no longer PENDING, skipping assignment.`);
      return;
    }

    // 2. Discover nearest store using Geo-hashing
    // GEORADIUS or GEOSEARCH: we use GEOSEARCH
    const nearestStores = await redis.geosearch(
      'quicky:stores:locations',
      'FROMLONLAT', longitude, latitude,
      'BYRADIUS', 3, 'km', // 3km max radius
      'ASC', // nearest first
      'WITHDIST'
    ) as unknown as [string, string][]; // Returns array of [member, distance]

    // Find the nearest store that hasn't ignored the order, is open, and within its delivery radius
    let selectedStoreId: string | null = null;
    let selectedStore = null;

    for (const [storeId, distanceStr] of nearestStores) {
      if (!ignoredStoreIds.includes(storeId)) {
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (store && store.isOpen) {
          const distanceKm = parseFloat(distanceStr);
          const storeRadiusKm = Math.min(store.deliveryRadiusKm || 3, 3);
          
          if (distanceKm <= storeRadiusKm) {
            selectedStoreId = storeId;
            selectedStore = store;
            break;
          }
        }
      }
    }

    if (!selectedStoreId || !selectedStore) {
      console.log(`No available stores found for Order ${orderId} after ${attempt} attempts. Cancelling.`);
      
      const cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });
      
      await redis.publish('user-notifications', JSON.stringify({
        userId: cancelledOrder.userId,
        event: 'order-cancelled',
        payload: { orderId }
      }));
      
      return;
    }

    console.log(`Assigning Order ${orderId} to Store ${selectedStoreId}...`);

    let etaSeconds = 0;
    const store = selectedStore;
    
    try {
      if (process.env['GOOGLE_MAPS_API_KEY'] && store) {
        // Fetch ETA from Google Maps Distance Matrix
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${store.latitude},${store.longitude}&destinations=${latitude},${longitude}&key=${process.env['GOOGLE_MAPS_API_KEY']}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(url, { signal: controller.signal as any });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.rows?.[0]?.elements?.[0]?.duration?.value) {
          etaSeconds = data.rows[0].elements[0].duration.value;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch ETA from Google Maps', e);
    }

    // 3. Acquire Distributed Lock for the Order
    let lock;
    try {
      lock = await redlock.acquire([`order_lock:${orderId}`], 60000); // 60 seconds TTL
    } catch (error) {
      console.log(`Could not acquire lock for Order ${orderId}. Another process might be handling it.`);
      return;
    }

    try {
      // Create an OrderTicket to track this specific store offer
      const ticket = await prisma.orderTicket.create({
        data: {
          orderId,
          storeId: selectedStoreId,
          status: 'BROADCASTED',
          expiresAt: new Date(Date.now() + 60000)
        }
      });

      // Save ETA to Redis for use upon acceptance
      await redis.set(`quicky:ticket:eta:${ticket.id}`, etaSeconds, 'EX', 120);

      const payload = {
        orderId,
        ticketId: ticket.id,
        expiresAt: ticket.expiresAt.toISOString(),
        etaSeconds: etaSeconds.toString()
      };

      // 4. Notify Store via WebSockets using Redis Pub/Sub
      await redis.publish('store-notifications', JSON.stringify({
        storeId: selectedStoreId,
        event: 'new-order-assignment',
        payload
      }));

      // 4b. Notify via FCM Push
      if (store?.fcmToken) {
        try {
          await messaging.send({
            token: store.fcmToken,
            data: payload,
            notification: {
              title: 'New Order Request!',
              body: 'Tap to view and accept this order within 60 seconds.'
            },
            android: {
              priority: 'high'
            }
          });
          console.log(`Sent FCM push notification to store ${selectedStoreId}`);
        } catch (fcmError) {
          console.warn(`Failed to send FCM to store ${selectedStoreId}`, fcmError);
        }
      }

      console.log(`Notified Store ${selectedStoreId} about Order ${orderId}. Waiting 60s for acceptance...`);

      // 5. Schedule a check after 60s to see if accepted. If not, retry assignment.
      await storeAssignmentQueue.add(
        'retry_assignment',
        {
          orderId,
          latitude,
          longitude,
          attempt: attempt + 1,
          ignoredStoreIds: [...ignoredStoreIds, selectedStoreId]
        },
        { delay: 60000 } // Wait 60s before trying the next store
      );

    } finally {
      // We will skip lock.release() to let it naturally expire in 60s.
    }
  },
  {
    connection: redis as any,
  }
);
