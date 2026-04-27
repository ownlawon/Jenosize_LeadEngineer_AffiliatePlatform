# --- Builder ---
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy workspace manifests for layer-cached install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile=false

# Copy source
COPY apps/api ./apps/api
COPY packages/adapters ./packages/adapters
COPY packages/shared ./packages/shared

RUN pnpm --filter @jenosize/api db:generate \
 && pnpm --filter @jenosize/api build

# --- Runner ---
FROM node:20-alpine AS runner
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

# Run prisma migrations on boot, then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
