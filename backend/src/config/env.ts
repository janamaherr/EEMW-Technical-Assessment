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
  maxFileSizeBytes: Math.floor(env.MAX_FILE_SIZE_MB * 1024 * 1024),
} as const;

export type Config = typeof config;
