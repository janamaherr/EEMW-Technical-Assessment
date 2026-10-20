import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { config } from './env';

// Single shared client for the whole process (the pg adapter manages the connection pool).
const adapter = new PrismaPg({ connectionString: config.databaseUrl });

export const prisma = new PrismaClient({
  adapter,
  log: config.isProduction ? ['error'] : ['warn', 'error'],
});
