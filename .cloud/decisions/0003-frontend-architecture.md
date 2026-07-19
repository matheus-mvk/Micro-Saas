# ADR 0003 - Frontend Architecture

Status: accepted

Decision: Next.js App Router with Server Components by default and Client Components for interactive boundaries.

Options: SPA, Pages Router, App Router.

Rationale: App Router supports public and authenticated route groups, streaming states and progressive data access.

Consequences: client-side state must remain local unless remote state requires TanStack Query.
