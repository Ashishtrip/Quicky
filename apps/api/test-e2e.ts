import { io } from 'socket.io-client';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:4000';
const STORE_ID = 'store_1';
const USER_ID = 'guest_user';

const prisma = new PrismaClient();

async function runTest() {
  console.log('--- Starting E2E Test ---');

  // Clear previous tickets for guest_user
  await prisma.orderTicket.deleteMany({
    where: { order: { userId: USER_ID } }
  });

  const storeSocket = io(`${API_URL}/store`, { auth: { storeId: STORE_ID }, transports: ['websocket'] });
  const userSocket = io(`${API_URL}/user`, { auth: { userId: USER_ID }, transports: ['websocket'] });

  const connectPromise = Promise.all([
    new Promise<void>(resolve => storeSocket.on('connect', () => resolve())),
    new Promise<void>(resolve => userSocket.on('connect', () => resolve()))
  ]);

  await connectPromise;
  console.log('✅ Sockets connected');

  return new Promise<void>((resolve, reject) => {
    // 1. Listen for new-order-assignment on storeSocket
    storeSocket.on('new-order-assignment', async (payload: any) => {
      console.log('📩 Store received new-order-assignment:', payload);
      try {
        // Store accepts the order
        const response = await axios.post(`${API_URL}/tickets/${payload.id}/accept`, {
          storeId: STORE_ID
        });
        console.log('✅ Store accepted the order. Response status:', response.status);
      } catch (err: any) {
        console.error('❌ Store failed to accept the order:', err.response?.data || err.message);
        reject(err);
      }
    });

    // 2. Listen for order-accepted on userSocket
    userSocket.on('order-accepted', (payload: any) => {
      console.log('📩 User received order-accepted:', payload);
      console.log('🎉 E2E Flow Successful!');
      
      // Cleanup
      storeSocket.disconnect();
      userSocket.disconnect();
      resolve();
    });

    // 3. Trigger the checkout flow as a user
    console.log('🛒 User initiating checkout...');
    axios.post(`${API_URL}/checkout`, {
      customerId: USER_ID,
      lat: 28.7041,
      lng: 77.1025, // Rohini, Delhi coordinates
      radiusKm: 3,
      paymentMethod: 'COD',
      items: [
        { catalogItemId: 'clkj12345', quantity: 2, expiryBucket: 'USE_TODAY' }
      ]
    }).then(response => {
      console.log('✅ Checkout successful. Order ID:', response.data.id);
    }).catch(err => {
      console.error('❌ Checkout failed:', err.response?.data || err.message);
      reject(err);
    });
  });
}

runTest().then(() => {
  console.log('--- Test Completed Successfully ---');
  process.exit(0);
}).catch(err => {
  console.error('--- Test Failed ---', err);
  process.exit(1);
});
