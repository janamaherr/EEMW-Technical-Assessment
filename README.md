# Document Repository (POC)

A proof-of-concept document repository where employees upload, version, search and download corporate documents such as policies, reports and technical docs. It's a **Next.js** frontend and a layered **Node.js/Express** REST API, with **PostgreSQL** for metadata, **Redis** for caching search results, and a **Docker volume** for files. Every document has a full version history. Access is controlled by department and role, and the rules are enforced inside the database query, so users never see, or learn about, documents they aren't allowed to open. The whole stack starts with one command: `docker compose up -d --build`.

> 🎥 **POC video:** https://drive.google.com/drive/folders/1V8FAUwV6q7wfhvJ-lbLG7bMCq5miHYGV?usp=sharing

## Contents

- [Features](#features)
- [Assumptions](#assumptions)
- [Tech stack](#tech-stack)
- [How to run](#how-to-run)
- [Seeded accounts](#seeded-accounts)
- [API](#api)
- [Documentation](#documentation)
- [What I'd do next](#what-id-do-next-with-more-time)

## Features

**Required by the brief**
- **Upload** a document with metadata: title, description, tags, visibility, allowed departments.
- **Search** by title (partial, case-insensitive, as you type), by tags (matches any) and by uploader.
- **View and download** the current file or any older version.
- **Version history:** a new upload becomes the current version; older versions are kept and stay downloadable.
- **Department permissions:** restricted documents are visible only to the owner department and the departments you choose.
- **Validation and errors on the API side:** missing fields → 400, wrong file type → 415, file too large → 413, unknown document → 404, all in one consistent JSON error shape.

**Extras beyond the brief**
- **Sign up and log in** with JWT; Employees and Managers can register, and there is one global Admin.
- **Role-based visibility:** a "Managers only" switch (`min_role`) on top of the department rules.
- **Edit rights:** the admin can change any document, a manager can change documents owned by their department, and an employee only their own uploads.
- **Soft delete:** a deleted document disappears from the app, but its rows and files are kept.
- **Redis caching** of search results per user, with instant invalidation on any change. The app keeps working if Redis is down.
- **"My documents" filter, sort** (newest or title A–Z) and **pagination** (10 per page); filters live in the URL, so refresh and Back keep them.
- **In-page preview:** PDF, images and text are shown on the detail page; Word and Excel are offered as downloads.
- **Hidden restricted documents:** documents you may not see return **404** (not 403), so their existence isn't revealed.
- **Thorough file checks:** the extension, the MIME type and the file's actual content (magic bytes) must all match.
- **Fully dockerized:** migrations run automatically, the demo data is seeded once, and data persists across restarts.

## Assumptions

- **One global admin** with no department. Everyone else belongs to exactly one department.
- **Departments are fixed** (HR, Engineering, Legal, Finance) and come from the seed; there is no UI to manage them.
- **Self-signup** can choose Employee or Manager; Admin can't be chosen at signup.
- **Owner department:** a non-admin's uploads are always owned by their own department; the admin picks the owner department.
- **Restricted documents** are visible to the owner department plus the selected departments. The admin and the uploader can always see their own documents.
- **A new version can be any allowed file type**; it doesn't have to match the previous one.
- **Allowed files:** PDF, DOCX, XLSX, TXT, PNG and JPG/JPEG, up to **20 MB**.
- **Tags are free-form** and stored lowercase; new tags are created on upload (at most 10 per document).
- **Delete is a soft delete**; there is no restore UI yet.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Node.js 22, Express 5, TypeScript, zod, multer, JWT, bcrypt |
| Database | PostgreSQL 16 with Prisma 7 (migrations, `pg_trgm` trigram index) |
| Cache | Redis 7 (ioredis) |
| File storage | Local disk, as a named Docker volume in Docker mode |
| DevOps | Docker, Docker Compose, multi-stage images |

## How to run

### 1. Quick start with Docker (recommended)

Requires only **Docker** (Docker Desktop on Windows/macOS).

```bash
docker compose up -d --build
```

Then open **http://localhost:3000** and log in, e.g. `employee1@gmail.com` / `123456` (see [Seeded accounts](#seeded-accounts)).

- The **first build takes a few minutes**; later starts take seconds.
- The command starts **four containers**: `postgres` (5432), `redis` (6379), `backend` (4000) and `frontend` (3000). The backend waits for healthy databases, and the frontend waits for a healthy backend.
- **On every start the backend** applies pending migrations (`prisma migrate deploy`), then **seeds demo data only if the database is empty**, then starts the API. Restarting never wipes data.
- **No `.env` file is needed.** Every setting has a default; copy `.env.example` to `.env` to override any of them (e.g. `JWT_SECRET`).

| Command | What it does |
|---|---|
| `docker compose ps` | Show the containers and their health |
| `docker compose logs -f backend` | Follow the API logs |
| `docker compose down` | Stop everything; **data and files are kept** |
| `docker compose up -d` | Start again; nothing is re-seeded |
| `docker compose down -v` | Stop and **delete all data** (database, cache, uploaded files); the next start seeds fresh demo data |

### 2. Local development (optional)

Use this to work on the code with hot reload. Requires **Node.js 20.19+ or 22.13+** (developed on Node 22) and Docker for the databases.

> The full Docker stack and local `npm run dev` use the **same ports** (3000 and 4000), so they **can't run at the same time**. Stop the app containers first: `docker compose stop backend frontend`.

Run each command on its own line; this works in Windows PowerShell, bash and zsh.

**Terminal 1: databases and backend** (http://localhost:4000)

```powershell
docker compose up -d postgres redis
cd backend
copy .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

**Terminal 2: frontend** (http://localhost:3000)

```powershell
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

(On macOS/Linux use `cp` instead of `copy`.)

Notes:
- `npm install` in `backend` also generates the Prisma client.
- The local backend stores files in `backend/uploads`, and the Docker backend in a Docker volume. Both modes share the same database, so when you switch modes, run `npm run db:seed` (in `backend`) to reset the data and files.

**Backend scripts** (in `backend/`)

| Script | What it does |
|---|---|
| `npm run dev` | API with hot reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` / run the compiled API |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |
| `npm run db:migrate` | Apply / create migrations (`prisma migrate dev`) |
| `npm run db:seed` | Wipe and re-seed demo data and files |
| `npm run db:reset` | Drop the database, re-apply all migrations, then seed |
| `npm run db:studio` | Browse the data in Prisma Studio |

**Frontend scripts** (in `frontend/`): `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Seeded accounts

All passwords are **`123456`**.

| Email | Role | Department | Good for trying… |
|---|---|---|---|
| `admin@gmail.com` | Admin | Global | sees and edits everything; picks the owner department on upload |
| `manager1@gmail.com` | Manager | HR | sees "Salary Bands 2026" (HR, managers only) |
| `manager2@gmail.com` | Manager | Engineering | edits Engineering documents |
| `employee1@gmail.com` | Employee | HR | does **not** see "Q3 Financial Report" or "Salary Bands 2026" |
| `employee2@gmail.com` | Employee | Engineering | owns "Engineering Onboarding Guide" (3 versions) |
| `employee3@gmail.com` | Employee | Legal | sees "Vendor Contract Template" but can't edit others' documents |
| `employee4@gmail.com` | Employee | Finance | sees "Q3 Financial Report" (Finance only) |

## API

All routes are under **`http://localhost:4000/api`**. Routes marked ✅ need `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Health check |
| GET | `/departments` | – | List departments (for the signup form) |
| POST | `/auth/signup` | – | Register as EMPLOYEE or MANAGER → `{ token, user }` |
| POST | `/auth/login` | – | Log in → `{ token, user }` |
| GET | `/auth/me` | ✅ | Current user with department |
| GET | `/documents` | ✅ | Search: `q` (partial title), `tags` (comma-separated, any), `uploaderId`, `mine=true`, `sort=newest\|title`, `page`, `pageSize` (max 50) → `{ items, page, pageSize, total, totalPages }`. Response header `X-Cache: HIT\|MISS` |
| POST | `/documents` | ✅ | Upload (multipart: `file`, `title`, `description`, `tags`, `visibility`, `allowedDepartmentIds`, `minRole`, `ownerDepartmentId`) |
| GET | `/documents/:id` | ✅ | Full metadata, allowed departments, current version, `canEdit` |
| DELETE | `/documents/:id` | ✅ | Soft delete → 204 |
| GET | `/documents/:id/versions` | ✅ | Version history, newest first, with `isCurrent` |
| POST | `/documents/:id/versions` | ✅ | Upload a new version (multipart: `file`, `changeNote`) |
| GET | `/documents/:id/file` | ✅ | Current file; `?disposition=inline\|attachment` (default attachment) |
| GET | `/documents/:id/versions/:versionId/file` | ✅ | A specific version's file |
| GET | `/users` | ✅ | Users for the uploader filter (id, name, department) |
| GET | `/tags` | ✅ | All tag names |

- **Errors** always look like `{ "error": { "code", "message", "details?" } }`, with 400, 401, 403, 404, 409, 413 or 415 as appropriate.
- **Example requests**, including failure cases, are in [backend/requests.http](backend/requests.http) (VS Code REST Client extension).

## Documentation

- [docs/architecture.md](docs/architecture.md): architecture diagram, upload and search flows, design choices, how it would scale ([PNG version](docs/architecture.png))
- [docs/database.md](docs/database.md): ER diagram, tables, versioning approach, access rules, indexes

## What I'd do next with more time

- **Move the JWT from localStorage to an HTTP-only cookie** (with CSRF protection), so injected scripts can't read the token.
- **Search inside file contents:** extract text from PDF, DOCX and XLSX on upload and index it with PostgreSQL full-text search or OpenSearch.
- **Virus scanning of uploads** (e.g. ClamAV) before a file becomes available.
- **An audit log** of who viewed, downloaded, uploaded or deleted what, and when.
- Automated tests: API integration tests (Vitest + Supertest against a test database) and the browser click-through as Playwright tests in CI.
- Object storage (S3) with signed URLs, plus restore for soft-deleted documents and an admin UI for users and departments.
