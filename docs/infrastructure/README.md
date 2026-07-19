# Infrastructure Documentation

This directory documents the operating baseline for the multi-tenant logistics intelligence SaaS platform.

The current platform baseline is a pnpm/Turborepo monorepo for a logistics intelligence SaaS:

- API: NestJS, TypeScript, Prisma, MySQL.
- Web: Next.js App Router, TypeScript, TanStack Query.
- Async/cache/realtime: Redis, BullMQ, Socket.IO.
- Local runtime: Docker Compose.

Dockerfiles, compose files, package scripts, and application code are owned by other integration agents. These documents define the infrastructure contract and safe integration points without changing those runtime files.

## Documents

- [Local environment](./local-environment.md): local prerequisites, environment variables, startup flow, and tenant isolation checks.
- [Docker](./docker.md): image and compose expectations, container runtime guidance, and validation commands.
- [CI](./ci.md): GitHub Actions workflow behavior, quality gates, and extension points.
- [Deployment options](./deployment-options.md): recommended deployment targets and rollout patterns.
- [Troubleshooting](./troubleshooting.md): common failure modes and diagnostic commands.
- [Risks and recommendations](./risks-and-recommendations.md): infrastructure risks, mitigations, and next steps.

## Operating Principles

- Tenant data isolation must be validated before every production release.
- Secrets must be injected by the runtime platform and must not be committed to source control.
- CI should fail on deterministic quality gates and avoid hidden dependencies on local machines.
- Docker artifacts should be reproducible from committed source and lockfiles.
- Deployments should be reversible through versioned images and explicit migrations.

## Expected Environments

- `local`: developer workstation and local containers.
- `ci`: GitHub Actions validation for pull requests and protected branches.
- `staging`: production-like environment for migrations, integration checks, and smoke tests.
- `production`: customer-facing runtime with backups, monitoring, and rollback procedures.

## Baseline Checks

Before enabling a deployment path, confirm that the platform has documented answers for:

- Tenant identification strategy: signed token claim, verified domain/subdomain, service credential, or protected admin context.
- Database isolation model: pooled MySQL with tenant keys unless an enterprise tenant needs a dedicated database or environment.
- Migration ownership and rollback process.
- Secrets source of truth and rotation policy.
- Queue, cache, and background job tenant scoping.
- Observability fields required in logs and traces.
