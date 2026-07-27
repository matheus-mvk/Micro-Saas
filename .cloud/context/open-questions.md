# Open Questions

Status: `IN_DESIGN`

## Product and Domain

- Should the MVP prioritize freight simulation/comparison or shipment tracking after authentication?
- Should customers support CPF and CNPJ from the first customer module, or start with normalized document string and type?
- Which shipment creation paths are required first: selected simulation option, manual entry, import, or integration?
- Which tracking sources are required for MVP: manual, import, carrier API, webhook, or all staged gradually?

## Identity and Access

- Should user email be unique globally or unique per tenant for the MVP?
- Should the first version support one tenant per user only, or introduce memberships immediately?
- Is a platform superadmin role required for the technical test scope?
- Should MFA be mandatory for ADMIN and MANAGER from first release, or tenant-configurable later?
- Which OAuth provider comes first: Google, GitHub, or both in the same iteration?
- Should cookie-based mutations add synchronizer CSRF tokens or double-submit CSRF tokens first?
- Should logout global revoke every refresh token for the user or only the current refresh token family?
- Should access token be returned in the JSON response for API clients, or be cookie-only for the web client?

## Freight Pricing

- What tariff examples should drive the first rate table model?
- Are pricing rules mostly lane/weight based, postal-code based, state based, or carrier-specific?
- Should distance be mandatory for pricing or optional with fallback manual input?

## Infrastructure and Operations

- Which storage provider should be used for uploads: local development storage, S3-compatible, or a cloud-specific service?
- What are expected file size limits and row count limits for CSV/XLSX imports?
- Should Redis be exposed to host during local development or restricted to Docker network plus optional CLI container?
- Which deploy target should guide production Docker and observability hardening?

## UX

- Should the authenticated navigation use Portuguese module names permanently?
- Should landing metrics be removed until real customer data exists?
- What is the primary CTA for the public landing: login, demo request, or contact sales?
