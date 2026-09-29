# syntax=docker/dockerfile:1
# Imagem oficial do TakeOps (ADR-037): serve Coolify e docker-compose.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependências. O postinstall roda `prisma generate`, que precisa do schema
# e de uma DATABASE_URL qualquer (não conecta).
FROM base AS deps
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM base AS build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# CLI do Prisma só para `migrate deploy` no start, na versão do lockfile.
FROM base AS migrator
WORKDIR /migrate
COPY package.json package-lock.json ./
RUN PRISMA_VERSION="$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version")" \
  && echo '{"private":true}' > package.json \
  && rm package-lock.json \
  && npm install --no-audit --no-fund "prisma@${PRISMA_VERSION}"

FROM base AS runner
ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME=0.0.0.0 \
  MIGRATE_ON_START=true

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=migrator --chown=node:node /migrate/node_modules /migrate/node_modules
COPY --chown=node:node prisma /migrate/prisma
COPY --chown=node:node prisma.config.ts /migrate/prisma.config.ts
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
