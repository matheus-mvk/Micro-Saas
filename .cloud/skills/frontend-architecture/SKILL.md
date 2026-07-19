# Frontend Architecture

Status: `IN_PROGRESS`

Objective: guide Next.js App Router frontend evolution.

Scope: public pages, authenticated shell, providers, HTTP client, schemas, forms and UI states.

Context: Server Components by default; Client Components for interactivity only.

Entities: typed DTOs from API/shared contracts.

Use Cases: UI flow per approved module.

Endpoints: frontend consumes documented API only.

Validations: Zod and React Hook Form for forms.

Permissions: UI reflects API authorization but does not enforce security alone.

Tenant: tenant selector is future; tenant state must not bypass server authorization.

Security: no secrets in `NEXT_PUBLIC_*`; no refresh token in localStorage.

Audit: user-triggered critical actions must map to backend audit.

Events: realtime client future for notifications and progress.

Integrations: browser calls only to first-party API.

Tests: Vitest, Testing Library and future Playwright flows.

Errors: surface API error messages without leaking internals.

Decisions: ADR 0003.

Pending: auth session provider after auth specification.

History: initial foundation.
