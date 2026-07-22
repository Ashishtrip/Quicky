import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(); // default localhost:6379

async function simulateOrder() {
  console.log("Creating dummy order...");
  
  // 1. Ensure user exists
  await prisma.user.upsert({
    where: { id: 'test_customer' },
    update: {},
    create: {
      id: 'test_customer',
      name: 'Test Customer',
      email: 'test@quicky.local',
    },
  });

  // 2. Create the dummy order
  const order = await prisma.order.create({
    data: {
      userId: 'test_customer',
      status: 'PENDING',
      totalAmount: 150,
      deliveryFee: 25,
      items: {
        create: [
          {
            catalogItemId: 'test_item',
            quantity: 1,
            price: 150,
            expiryBucket: 'FRESH_STOCK'
          }
        ]
      },
    },
  });
  console.log(`Order created with ID: ${order.id}`);

  // 3. Create the OrderTicket directly for store_1 to skip the BullMQ worker matching logic
  // (This forces the ticket to go directly to store_1 for testing purposes)
  const ticket = await prisma.orderTicket.create({
    data: {
      orderId: order.id,
      storeId: 'store_1',
      status: 'BROADCASTED',
      expiresAt: new Date(Date.now() + 60000) // 60 seconds from now
    }
  });
  console.log(`Ticket created for store_1: ${ticket.id}`);

  // 4. Publish the Socket.io event over Redis
  const payload = {
    orderId: order.id,
    ticketId: ticket.id,
    expiresAt: ticket.expiresAt.toISOString(),
    etaSeconds: "120"
  };

  await redis.publish('store-notifications', JSON.stringify({
    storeId: 'store_1',
    event: 'new-order-assignment',
    payload
  }));
  
  console.log("WebSocket event broadcasted to store_1!");
  
  await prisma.$disconnect();
  redis.disconnect();
}

simulateOrder().catch(console.error);
