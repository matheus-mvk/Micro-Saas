# ADR 0011 - Infrastructure

Status: accepted

Decision: Docker Compose for local MySQL, Redis, API and web, plus multi-stage Dockerfiles.

Options: local services only, Compose only for dependencies, full app Compose.

Rationale: a technical test benefits from reproducible local startup.

Consequences: production exposure and secret management must be handled separately before deployment.
