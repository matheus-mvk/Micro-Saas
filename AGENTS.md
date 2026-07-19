# Agent Rules

## General

- Work only inside this repository.
- Do not use proprietary code or unverified snippets.
- Do not invent features without recording the hypothesis.
- Do not change ADRs silently.
- Do not overwrite another agent's work without final review.
- Do not create dead code or abstractions without a real use case.
- Do not ignore errors, weaken security, or commit secrets.
- Keep documentation, code, scripts, and decisions aligned.

## Coordination

- Backend defines API contracts together with frontend.
- Frontend does not assume undocumented API responses.
- UI/UX does not change business rules.
- Security may block unsafe choices.
- Infrastructure does not expose services without explicit environment need.
- Shared contracts, database schema, environment variables, Docker and root scripts require final review.
- The final reviewer resolves conflicts and records the outcome.

## Completion

A delivery is complete only when it compiles, passes lint, typecheck, tests and build, has documentation, has the relevant skill updated, has security review and has integration review.
