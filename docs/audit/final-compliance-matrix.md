# Final Compliance Matrix

Date: 2026-07-25

| Requirement original | Module | Screen | Endpoint | Table | Tests | Security | Tenant | Performance | Responsiveness | Accessibility | Demo data | Docs | Status | Evidence | Limitation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Landing page | Public web | `/` | none | none | smoke | public | N/A | static | responsive CSS | semantic basics | N/A | yes | `PARTIALLY_COMPLETED` | `page.tsx` | Missing several required sections |
| Login email/password | Auth | `/login` | `/auth/login` | `users`, `refresh_tokens`, `audit_logs` | unit partial, web mocked | cookies/rate limit partial | tenant resolved from user | bounded lookup | yes | labels/errors | admin seeded | yes | `PARTIALLY_COMPLETED` | auth files | No backend integration test executed |
| Dashboard | Dashboard | `/dashboard` | `/dashboard/summary` | current foundation tables | typecheck only | private by default | filtered by tenant | aggregate/count queries | cards responsive | loading/error/empty | seed added | yes | `PARTIALLY_COMPLETED` | dashboard service/UI | Limited by missing domain models |
| Multi-tenancy | Shared | shell | auth/me/dashboard | tenant-scoped tables | missing cross-tenant tests | token tenant context | partial | indexes exist | N/A | N/A | two tenants | yes | `PARTIALLY_COMPLETED` | schema/auth/dashboard | No business CRUD coverage |
| Users | Users | none | none | `users` | none | role enum only | table has tenant | indexed | none | none | seed users | partial | `PARTIALLY_COMPLETED` | seed/schema | No CRUD/invites/MFA/session UI |
| Customers | Customers | none | none | `customers` | none | none | table has tenant | indexed | none | none | seed customer | partial | `PARTIALLY_COMPLETED` | seed/schema | No addresses/CRUD/UI |
| Carriers | Carriers | none | none | `carriers` | none | none | table has tenant | indexed | none | none | seed carrier | partial | `PARTIALLY_COMPLETED` | seed/schema | No services/rates/UI |
| Freight simulation | Freight | dashboard metric only | none | `freight_simulations` | none | none | table has tenant | route/status indexes | none | none | seed simulation | partial | `PARTIALLY_COMPLETED` | seed/schema | No calculation/options/history |
| Imports/async/realtime | Imports | nav disabled | none | `import_jobs` | none | unsafe realtime scaffold | table has tenant | status index | none | none | seed import job | partial | `PARTIALLY_COMPLETED` | seed/schema | No upload, worker or realtime |
| Shipments/tracking | Shipments/tracking | none | none | none | none | none | none | none | none | none | none | partial | `NOT_COMPLETED` | absent models | Not implemented |
| Insights | Insights | none | none | none | none | none | none | none | none | none | none | partial | `NOT_COMPLETED` | empty module | Not implemented |
| OAuth/MFA/recovery | Auth | none | none | none | none | none | none | none | none | none | none | partial | `NOT_COMPLETED` | no code | Requires implementation and external config |
| Deploy | Infrastructure | N/A | health | MySQL/Redis | not fully run | localhost only | N/A | compose health | N/A | N/A | seed | yes | `PARTIALLY_COMPLETED` | Docker files | Docker not validated from this WSL |
