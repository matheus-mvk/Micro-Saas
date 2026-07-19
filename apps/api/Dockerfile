FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/config-typescript/package.json packages/config-typescript/package.json
COPY packages/config-eslint/package.json packages/config-eslint/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install

FROM deps AS builder
COPY . .
RUN pnpm --filter @logistics/api db:generate
RUN pnpm --filter @logistics/shared build
RUN pnpm --filter @logistics/api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp && corepack enable
COPY --from=builder --chown=nodeapp:nodeapp /app /app
USER nodeapp
EXPOSE 3333
CMD ["pnpm", "--filter", "@logistics/api", "start:prod"]
