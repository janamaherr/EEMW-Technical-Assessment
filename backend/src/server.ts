import fs from 'node:fs';
import { createApp } from './app';
import { config } from './config/env';
import { prisma } from './config/prisma';
import { connectRedis, disconnectRedis } from './config/redis';

fs.mkdirSync(config.uploadDir, { recursive: true });

// Non-blocking: the API starts (and serves uncached) even if Redis is down.
connectRedis();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await Promise.allSettled([prisma.$disconnect(), disconnectRedis()]);
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
