# Document Repository (POC)

A proof-of-concept document repository where employees can upload, store, version and search corporate documents.

> Work in progress. Full documentation (architecture, design choices, assumptions) will be added as the project evolves.

## Stack

- **Backend:** Node.js, Express, TypeScript (`/backend`)
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (`/frontend`)
- **Database:** PostgreSQL 16, with Redis 7 for caching
- **DevOps:** Docker Compose

## Quick start

Requires Node.js 20.19+ or 22.13+ (developed on Node 22) and Docker. Older Node versions print a harmless `EBADENGINE` warning from an ESLint dependency.

Run each command on its own line. In **Windows PowerShell 5.1**, `&&` is not supported; use separate lines (or `;`), and run the backend and frontend in two separate terminals.

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

# 4. Frontend (http://localhost:3000), in a second terminal
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev
```

Then open http://localhost:3000 and log in with a seeded account (e.g. `employee1@gmail.com` / `123456`), or sign up.

For a production build of the frontend: `cd frontend && npm run build && npm start`.

### Frontend

| Page | What it does |
|---|---|
| `/login`, `/signup` | Log in, or create an Employee/Manager account (logs in automatically). Logged-in users are redirected to `/`. |
| `/` | Search: title search as you type (debounced), tag multi-select (any), uploader, "My documents", sort, 10 per page. All filters live in the URL, so refresh and Back keep them. |
| `/upload` | File + metadata form: tags with suggestions, Public/Restricted with department checkboxes, "Managers only" switch, owner department (admins only). Files are checked in the browser and again by the API. |
| `/documents/[id]` | Metadata, in-page preview (PDF, image, text), download, version history with per-version downloads; "Upload new version" and "Delete" only when the user may edit. |

**How the frontend works:**
- The JWT is kept in `localStorage` and sent as `Authorization: Bearer …`. Any 401 on an authenticated request logs the user out and redirects to `/login`.
- Files are fetched with that header as blobs and shown or saved through `blob:` URLs, so tokens never appear in URLs.
- Pages are client-rendered and talk to the API directly; `src/lib/api` is the single typed fetch wrapper.

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
| GET | `/documents` | ✅ | Search: `q` (partial title), `tags` (comma-separated, any), `uploaderId`, `mine=true`, `sort=newest\|title`, `page`, `pageSize` (max 50) → `{ items, page, pageSize, total, totalPages }`. Cached in Redis for 60 s (`X-Cache: HIT\|MISS`) |
| GET | `/documents/:id` | ✅ | Full metadata, allowed departments, current version, `canEdit` |
| GET | `/documents/:id/versions` | ✅ | Version history, newest first, with `isCurrent` |
| GET | `/documents/:id/file` | ✅ | Current version's file; `?disposition=inline\|attachment` (default attachment) |
| GET | `/documents/:id/versions/:versionId/file` | ✅ | A specific (old or current) version's file |
| GET | `/users` | ✅ | Users for the uploader filter (id, name, department) |
| GET | `/tags` | ✅ | All tag names |

Errors always look like `{ "error": { "code", "message", "details?" } }`. Example requests, including failure cases, are in [backend/requests.http](backend/requests.http) (VS Code REST Client).

Allowed uploads: PDF, DOCX, XLSX, TXT, PNG, JPG/JPEG, up to 20 MB. The extension, the declared MIME type and the file's content are all checked. (DOCX/XLSX sent as `application/octet-stream`, as some browsers do, are accepted when the content is a valid Office container.)

**Access:** every read applies the access rules. A document the user may not see (restricted, managers-only, soft-deleted or unknown) is always a **404**, never 403, so its existence isn't revealed. Search applies the rules inside the SQL query, so `total` and pagination are always correct. Files can be viewed inline only as PDF, PNG, JPG or TXT; DOCX and XLSX are always downloaded.

**Caching:** search results are cached per user in Redis for 60 seconds. Every upload, new version or delete increments a "search generation" counter that is part of each cache key, so all cached searches are invalidated at once without scanning keys. If Redis is down, the API logs one warning and keeps working without the cache.

### Database scripts (in `backend/`)

| Script | What it does |
|---|---|
| `npm run db:migrate` | Apply / create migrations (`prisma migrate dev`) |
| `npm run db:seed` | Wipe and re-seed demo data and upload files |
| `npm run db:reset` | Drop the database, re-apply all migrations, then seed |
| `npm run db:studio` | Browse the data in Prisma Studio |

Seeded logins: `admin@gmail.com`, `manager1@gmail.com`, `employee1@gmail.com`, … all with password `123456`.

See [docs/database.md](docs/database.md) for the schema, versioning approach, permission model and ER diagram.
