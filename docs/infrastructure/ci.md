# Continuous Integration

The CI workflow lives at `.github/workflows/ci.yml`.

## Workflow Behavior

The workflow is intentionally defensive while the application manifests are owned by other agents:

- It checks out the repository.
- It installs Node.js.
- It detects the package manager from the lockfile or `packageManager` field.
- It installs dependencies only when `package.json` exists.
- It runs available scripts among `lint`, `typecheck`, `test`, and `build`.
- It validates Docker Compose configuration when compose files exist.

This lets the workflow exist before all application files are integrated, while still becoming stricter automatically as scripts and Docker files are added.

## Required Quality Gates

Once the application is integrated, these scripts should exist and be meaningful:

- `lint`: static analysis and formatting policy.
- `typecheck`: TypeScript or equivalent compile-time validation.
- `test`: deterministic unit and integration tests.
- `build`: production build verification through Turborepo.

The current root manifest already exposes these scripts through `pnpm`.

For a multi-tenant SaaS, CI should also include tests for:

- Tenant-scoped repositories and queries.
- Authorization checks across tenant boundaries.
- Cache key tenant scoping.
- Background job tenant context propagation.
- Migration safety for shared tables.

## Branch Protection

Recommended protected branch requirements:

- Require pull request review.
- Require the CI workflow to pass.
- Require conversation resolution.
- Block force pushes.
- Require linear history if that matches the team workflow.

## Secrets In CI

CI should not require production secrets. Use test-only credentials and ephemeral services.

If integration tests need external dependencies:

- Prefer containerized services started by the workflow.
- Use GitHub Actions secrets only for non-production test accounts.
- Rotate secrets on a defined schedule.
- Avoid logging connection strings or tokens.

## Future Extensions

Add these jobs once the application structure is available:

- Dependency vulnerability audit with an agreed severity threshold.
- Container image build and scan.
- Database migration dry run.
- End-to-end smoke tests against a preview environment.
- Artifact upload for coverage and build outputs.

When `pnpm-lock.yaml` is committed, CI uses `pnpm install --frozen-lockfile`. Until then it falls back to `pnpm install --no-frozen-lockfile` so the workflow can run during repository assembly.
