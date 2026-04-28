# --- Builder ---
FROM node:25-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Force devDeps so tailwind/postcss/typescript are present for `next build`
ENV NODE_ENV=development

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile=false --prod=false

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build shared first so its package.json main → dist/index.js resolves at
# runtime (next build still transpiles via transpilePackages, but a built
# dist also covers any non-Next consumers).
RUN pnpm --filter @jenosize/shared build

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @jenosize/web build

# --- Runner ---
FROM node:25-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy minimal artifacts for `next start` (no /public dir in this project)
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/packages ./packages

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["./node_modules/.bin/next", "start", "-p", "3000"]
