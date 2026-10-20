import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  UPLOAD_DIR: z.string().min(1).default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(20),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('2d'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  uploadDir: path.resolve(env.UPLOAD_DIR),
  maxFileSizeMb: env.MAX_FILE_SIZE_MB,
  maxFileSizeBytes: Math.floor(env.MAX_FILE_SIZE_MB * 1024 * 1024),
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  // Comma-separated list of allowed origins.
  corsOrigins: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
} as const;

export type Config = typeof config;
