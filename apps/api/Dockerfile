# --- Builder ---
FROM node:20-bookworm-slim AS builder
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

# Split into separate RUN steps so any failure shows the *exact* offending command.
# Diagnostics: confirm devDeps (esp. @nestjs/cli) actually landed before nest build.
RUN echo "=== node_modules/.bin (api) ===" \
 && ls /app/apps/api/node_modules/.bin/ | head -40 \
 && echo "=== nest CLI ===" \
 && /app/apps/api/node_modules/.bin/nest --version \
 && echo "=== tsc ===" \
 && /app/apps/api/node_modules/.bin/tsc --version

RUN pnpm --filter @jenosize/api db:generate

# Diagnostics: confirm src + tsconfig are present in the build context
RUN echo "=== api/src/ ===" \
 && ls -la /app/apps/api/src/ | head -10 \
 && echo "=== api/ root ===" \
 && ls -la /app/apps/api/ | head -20

# Compile via tsc directly (sidesteps any nest-CLI quirks like deleteOutDir
# silently skipping emit in some Railpack/Metal builder edge cases) and
# stream tsc's --listEmittedFiles so the build log proves compilation ran.
RUN cd /app/apps/api \
 && ./node_modules/.bin/tsc -p tsconfig.build.json --listEmittedFiles \
 && echo "=== dist/ after tsc ===" \
 && ls -la /app/apps/api/dist/ | head -20

RUN test -f /app/apps/api/dist/main.js && echo "Build OK: $(ls -la /app/apps/api/dist/main.js)"

# --- Runner ---
FROM node:20-bookworm-slim AS runner
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

# Run prisma migrations on boot, then start server.
# `ls` runs first so the deploy log shows whether dist/main.js exists when the
# container starts — surfaces missing-build issues without a silent crash loop.
CMD ["sh", "-c", "ls -la dist/ || true; npx prisma migrate deploy && node dist/main.js"]
