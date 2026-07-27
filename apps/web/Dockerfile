FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/config-typescript/package.json packages/config-typescript/package.json
COPY packages/config-eslint/package.json packages/config-eslint/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
COPY . .
RUN pnpm --filter @logistics/shared build
RUN pnpm --filter @logistics/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV WEB_PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=192
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
COPY --from=builder --chown=nodeapp:nodeapp /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nodeapp:nodeapp /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nodeapp:nodeapp /app/apps/web/public ./apps/web/public
USER nodeapp
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
