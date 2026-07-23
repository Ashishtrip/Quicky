import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import catalogRoutes from './routes/catalog';
import storeRoutes from './routes/stores';
import productRoutes from './routes/products';
import { checkoutRouter } from './routes/checkout';
import { ticketsRouter } from './routes/tickets';
import ratingRoutes from './routes/rating';
import { ordersRouter } from './routes/orders';
import { addressRoutes } from './routes/addresses';
import { usersRouter } from './routes/users';
import { storeLocationQueue } from './services/store-location.service';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup Socket.io Namespaces
const userIo = io.of('/user');
const storeIo = io.of('/store');

userIo.on('connection', (socket: any) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Join personal user room
  socket.join(socket.handshake.auth.userId || socket.id);
  
  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
  });
});

storeIo.on('connection', (socket: any) => {
  console.log(`🏪 Store connected: ${socket.id}`);
  
  // Store joins a regional topic
  socket.on('join_region', (region: string) => {
    socket.join(region);
    console.log(`🏪 Store ${socket.id} joined region: ${region}`);
  });

  // Store sends location update
  socket.on('location_update', async (data: { storeId: string; latitude: number; longitude: number }) => {
    if (data && data.storeId && data.latitude && data.longitude) {
      await storeLocationQueue.add('update_location', data, { removeOnComplete: true, removeOnFail: true });
    }
  });

  // Join personal store room
  socket.join(socket.handshake.auth.storeId || socket.id);
  
  socket.on('disconnect', () => {
    console.log(`🏪 Store disconnected: ${socket.id}`);
  });
});

// Setup Redis Pub/Sub for cross-process WebSocket emissions
import { redis } from './utils/redis';
const redisSubscriber = redis.duplicate();
redisSubscriber.subscribe('store-notifications', 'user-notifications');
redisSubscriber.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);
    if (channel === 'store-notifications') {
      const { storeId, event, payload } = data;
      if (storeId && event) {
        storeIo.to(storeId).emit(event, payload);
        console.log(`[WS] Relayed ${event} to store ${storeId}`);
      }
    } else if (channel === 'user-notifications') {
      const { userId, event, payload } = data;
      if (userId && event) {
        userIo.to(userId).emit(event, payload);
        console.log(`[WS] Relayed ${event} to user ${userId}`);
      }
    }
  } catch (e) {
    console.error('Failed to parse notification message', e);
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/catalog', catalogRoutes);
app.use('/stores', storeRoutes);
app.use('/products', productRoutes);
app.use('/checkout', checkoutRouter);
app.use('/tickets', ticketsRouter);
app.use('/orders', ordersRouter);
app.use('/orders/:orderId/rating', ratingRoutes);
app.use('/addresses', addressRoutes);
app.use('/users', usersRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env['PORT'] || 3000;

// Bind to 0.0.0.0 for cloud deployments (Railway, Render, etc.)
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
