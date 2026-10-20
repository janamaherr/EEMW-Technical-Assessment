import fs from 'node:fs';
import { createApp } from './app';
import { config } from './config/env';

fs.mkdirSync(config.uploadDir, { recursive: true });

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
