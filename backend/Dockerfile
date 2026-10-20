# syntax=docker/dockerfile:1

# ---- build: install all deps, generate the Prisma client, compile TypeScript ----
FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Schema + config first: `npm ci` runs `prisma generate` as a postinstall step.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- prod-deps: runtime dependencies only (includes the Prisma CLI for migrations) ----
FROM node:22-bookworm-slim AS prod-deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

# ---- runtime ----
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/uploads
WORKDIR /app

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma

# Upload folder owned by the non-root user; a named volume is mounted here in compose.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# 1. apply pending migrations  2. seed only if the database is empty  3. start the API.
# `exec` makes node PID 1 so `docker stop` shuts it down gracefully.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/prisma/seed.js --if-empty && exec node dist/src/server.js"]
