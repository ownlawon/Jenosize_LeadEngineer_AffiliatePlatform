# --- Builder ---
FROM node:25-bookworm-slim AS builder
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# NODE_ENV=production at build time would make pnpm skip devDependencies,
# stripping @nestjs/cli + TypeScript and breaking `nest build`. Pin to
# development for the builder stage; the runner stage flips it back.
ENV NODE_ENV=development

# Copy workspace manifests for layer-cached install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile=false --prod=false

# Copy source
COPY apps/api ./apps/api
COPY packages/adapters ./packages/adapters
COPY packages/shared ./packages/shared

# Compile workspace packages first so api can resolve them at runtime via
# package.json main → dist/index.js (without their dist, Node would fail
# trying to require a .ts entry point).
RUN pnpm --filter @jenosize/shared build \
 && pnpm --filter @jenosize/adapters build

RUN pnpm --filter @jenosize/api db:generate \
 && pnpm --filter @jenosize/api build \
 && test -f /app/apps/api/dist/main.js

# --- Runner ---
FROM node:25-bookworm-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3001
WORKDIR /app/apps/api

# Run prisma migrations on boot, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
