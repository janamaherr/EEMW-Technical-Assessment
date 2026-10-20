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

### API

All routes are under `http://localhost:4000/api`. Authenticated routes need `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Health check |
| GET | `/departments` | – | List departments (for the signup form) |
| POST | `/auth/signup` | – | Register as EMPLOYEE or MANAGER → `{ token, user }` |
| POST | `/auth/login` | – | Log in → `{ token, user }` |
| GET | `/auth/me` | ✅ | Current user with department |
| POST | `/documents` | ✅ | Upload a document (multipart: `file`, `title`, `description`, `tags`, `visibility`, `allowedDepartmentIds`, `minRole`, `ownerDepartmentId`) |
| POST | `/documents/:id/versions` | ✅ | Upload a new version (multipart: `file`, `changeNote`) |
| DELETE | `/documents/:id` | ✅ | Soft-delete a document |

Errors always look like `{ "error": { "code", "message", "details?" } }`. Example requests, including failure cases, are in [backend/requests.http](backend/requests.http) (VS Code REST Client).

Allowed uploads: PDF, DOCX, XLSX, TXT, PNG, JPG/JPEG, up to 20 MB. The extension, the declared MIME type and the file's content are all checked.

### Database scripts (in `backend/`)

| Script | What it does |
|---|---|
| `npm run db:migrate` | Apply / create migrations (`prisma migrate dev`) |
| `npm run db:seed` | Wipe and re-seed demo data and upload files |
| `npm run db:reset` | Drop the database, re-apply all migrations, then seed |
| `npm run db:studio` | Browse the data in Prisma Studio |

Seeded logins: `admin@gmail.com`, `manager1@gmail.com`, `employee1@gmail.com`, … all with password `123456`.

See [docs/database.md](docs/database.md) for the schema, versioning approach, permission model and ER diagram.
