import Redis from 'ioredis';
// @ts-ignore
import Redlock from 'redlock';

// Ensure you set REDIS_URL in your .env file
const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const redlock = new Redlock(
  [redis],
  {
    driftFactor: 0.01,
    retryCount:  3,
    retryDelay:  200, // time in ms
    retryJitter:  200, // time in ms
  }
);

redis.on('error', (err: any) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});
