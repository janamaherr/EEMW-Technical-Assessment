import { Redis } from 'ioredis';
import { config } from './env';

/**
 * Shared Redis client. Redis is an optional optimization: when it is down, commands fail fast
 * (no offline queue, short timeout) so callers can fall back to the database, and the client
 * keeps reconnecting in the background.
 */
export const redis = new Redis(config.redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  commandTimeout: 500,
  connectTimeout: 2000,
  retryStrategy: (attempt) => Math.min(attempt * 500, 5000),
});

let available = false;
let warned = false;

redis.on('ready', () => {
  available = true;
  warned = false;
  console.log('Redis connected');
});

redis.on('error', (err: Error) => {
  available = false;
  // ioredis emits an error on every reconnect attempt; log once per outage.
  if (!warned) {
    console.warn(`Redis unavailable, continuing without cache: ${err.message}`);
    warned = true;
  }
});

redis.on('end', () => {
  available = false;
});

export function isRedisAvailable(): boolean {
  return available && redis.status === 'ready';
}

export function connectRedis(): void {
  redis.connect().catch(() => {
    // Handled by the 'error' listener; the retry strategy keeps trying.
  });
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit().catch(() => redis.disconnect());
}
