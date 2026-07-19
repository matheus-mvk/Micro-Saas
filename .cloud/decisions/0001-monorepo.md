# ADR 0001 - Monorepo

Status: accepted

Decision: use pnpm workspaces with Turborepo.

Options: separate repositories, npm workspaces, pnpm with Turborepo.

Rationale: the challenge requires shared contracts and coordinated API/web builds. pnpm keeps dependency isolation clear and Turborepo provides task orchestration without a heavy platform.

Consequences: lockfile discipline is required; CI must run workspace-wide checks.
