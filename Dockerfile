# syntax=docker/dockerfile:1

# Multi-stage build for apps/web using Next.js standalone output.
# Build from the repository root:  docker build -t cctv-tool-suite .

ARG NODE_VERSION=22.13.1
ARG PNPM_VERSION=12.11.2

# ---- base: Node + pnpm ----
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
# Installed with npm rather than corepack so the pinned version is used as-is.
RUN npm install --global pnpm@${PNPM_VERSION}
WORKDIR /repo

# ---- deps: install workspace dependencies from the lockfile only ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/calc-core/package.json packages/calc-core/
RUN pnpm install --frozen-lockfile

# ---- build: compile the Next.js app ----
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @cctv/web build

# ---- runner: minimal runtime image as a non-root user ----
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone output mirrors the monorepo layout (outputFileTracingRoot = repo root).
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

# Health endpoint for liveness/readiness probes: GET /api/health
CMD ["node", "apps/web/server.js"]
