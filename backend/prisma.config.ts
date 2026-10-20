import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Read directly (not via env()) so `prisma generate` also works on a fresh clone
    // without a .env file; commands that need the database fail loudly without it.
    url: process.env.DATABASE_URL ?? '',
  },
});
