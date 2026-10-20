# Document Repository (POC)

A proof-of-concept document repository where employees can upload, store, version and search corporate documents.

> Work in progress. Full documentation (architecture, design choices, assumptions) will be added as the project evolves.

## Stack

- **Backend:** Node.js, Express, TypeScript (`/backend`)
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS (`/frontend`)
- **Database:** PostgreSQL 16, with Redis 7 for caching
- **DevOps:** Docker Compose

## Quick start

Requires Node.js 20+ (developed on Node 22) and Docker.

```bash
# 1. Environment
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Database + cache
docker compose up -d

# 3. Backend (http://localhost:4000)
cd backend && npm install && npm run dev

# 4. Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```
