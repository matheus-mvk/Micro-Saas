# ADR 0002 - Backend Architecture

Status: accepted

Decision: modular NestJS organized by capabilities, using Controller -> Use Case -> Repository -> Prisma for future business actions.

Options: layered technical modules only, full Clean Architecture, modular capability architecture.

Rationale: capability modules match future product slices while avoiding abstractions without current use.

Consequences: Prisma stays in infrastructure; controllers must not access persistence directly.
