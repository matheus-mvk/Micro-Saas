# Deployment Options

This document outlines deployment options for the platform. Final selection should follow traffic profile, compliance needs, team operations capacity, and tenant isolation requirements.

## Option 1: Managed Container Platform

Examples: AWS ECS/Fargate, Google Cloud Run, Azure Container Apps, Render, Fly.io.

Best fit:

- Small to medium operations team.
- Containerized services.
- Need for straightforward autoscaling.
- Preference for managed load balancing and runtime upgrades.

Recommended pattern:

- Build immutable API, web, and worker images in CI.
- Push images to a registry.
- Deploy to staging first.
- Run migrations as an explicit release step.
- Promote the same image digest to production.

## Option 2: Kubernetes

Best fit:

- Multiple services with independent scaling.
- Strong need for custom networking, operators, or internal platform controls.
- Team has Kubernetes operational experience.

Recommended pattern:

- Helm or Kustomize manifests.
- Separate namespaces for staging and production.
- External secrets operator or cloud-native secret integration.
- Horizontal pod autoscaling based on service metrics.
- Pod disruption budgets for critical services.

Avoid Kubernetes if the team does not have capacity to own cluster operations.

## Option 3: Traditional VM Deployment

Best fit:

- Early prototype with low operational complexity.
- Strict environment constraints.
- Existing VM-based operations.

Recommended pattern:

- Docker Compose or systemd-managed containers.
- Automated provisioning.
- Off-host backups.
- Reverse proxy with TLS automation.
- Explicit rollback scripts.

This option is simple but becomes risky as tenant count and traffic grow.

## Database Deployment

Recommended starting point:

- Managed MySQL-compatible relational database.
- Automated backups.
- Point-in-time recovery.
- Separate staging and production instances.
- Migration process with pre-deploy checks.

Tenant isolation strategy must be explicit:

- Shared database and shared schema: recommended initial pooled model, highest need for query discipline.
- Shared database and schema per tenant: stronger isolation, more migration complexity.
- Database per tenant: strongest isolation, highest operational overhead.

## Release Strategy

Recommended release flow:

1. Merge to protected branch after CI passes.
2. Build and tag immutable image.
3. Deploy to staging.
4. Run migrations and smoke tests.
5. Promote the same image digest to production.
6. Monitor errors, latency, queue depth, and tenant-specific anomalies.

## Rollback Strategy

Rollback must account for code and data:

- Keep previous image digests available.
- Prefer backward-compatible migrations.
- Separate destructive migrations into later releases.
- Keep a documented procedure for disabling risky feature flags.
- Validate restore procedures regularly.
