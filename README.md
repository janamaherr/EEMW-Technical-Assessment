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
cd backend
npm install          # also generates the Prisma client
npm run db:migrate   # apply migrations
npm run db:seed      # demo departments, users, tags, documents + files
npm run dev

# 4. Frontend (http://localhost:3000)
cd frontend && npm install && npm run dev
```

### Database scripts (in `backend/`)

| Script | What it does |
|---|---|
| `npm run db:migrate` | Apply / create migrations (`prisma migrate dev`) |
| `npm run db:seed` | Wipe and re-seed demo data and upload files |
| `npm run db:reset` | Drop the database, re-apply all migrations, then seed |
| `npm run db:studio` | Browse the data in Prisma Studio |

Seeded logins: `admin@gmail.com`, `manager1@gmail.com`, `employee1@gmail.com`, … all with password `123456`.

See [docs/database.md](docs/database.md) for the schema, versioning approach, permission model and ER diagram.
