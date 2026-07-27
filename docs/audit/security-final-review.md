# Security Final Review

Date: 2026-07-25

## Corrections Made

- Login rate limiting exists through Redis with local fallback.
- Request and correlation IDs are now bounded to a safe 64-character pattern.
- Demo seed refuses production execution unless `ALLOW_DEMO_SEED=true`.
- Dashboard endpoint is private by default and tenant-scoped.

## Major Remaining Risks

| Risk | Evidence | Status |
| --- | --- | --- |
| WebSocket tenant room can be chosen by client | `notifications.gateway.ts` | Not fixed |
| OAuth Google/GitHub absent | No provider/callback/controller | Not implemented |
| MFA/TOTP absent | No TOTP model/service/controller | Not implemented |
| Password recovery absent | No reset token model/service/controller | Not implemented |
| CSRF protection absent for cookie-authenticated mutations | Auth cookies and credentialed fetch | Not implemented |
| Access token returned in JSON | `AuthController.login` | Pending decision |
| RBAC matrix not applied to domain endpoints | No domain controllers | Pending domain implementation |

## Demo Guidance

Run only on localhost with development credentials. Do not expose this stack publicly until CSRF, OAuth/MFA decisions, WebSocket auth and production secrets are implemented.
