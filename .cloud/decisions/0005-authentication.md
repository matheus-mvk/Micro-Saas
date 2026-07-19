# ADR 0005 - Authentication

Status: proposed

Decision: prepare email/password, OAuth Google/GitHub, MFA/TOTP, short access tokens and rotating refresh tokens in HttpOnly cookies.

Options: localStorage tokens, cookie sessions, hybrid access token plus HttpOnly refresh cookie.

Rationale: browser storage is avoided for refresh tokens and device revocation remains possible.

Consequences: auth implementation must define CSRF posture, cookie domain, SameSite and rotation rules before coding.
