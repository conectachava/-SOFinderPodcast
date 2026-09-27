# Repository Engineering Policy

## Source of truth

- `package.json` declares scripts, supported Node/npm versions, and dependency ranges. `package-lock.json` is the install source of truth; keep both synchronized.
- Runtime configuration belongs in environment variables. Never commit credentials or paste them into logs, tests, docs, or generated artifacts.
- Treat existing docs as claims to verify against code. Record unknown behavior as unknown instead of inferring a contract.

## Change requirements

- Keep changes local to the owning module and update affected tests and operational docs when behavior or contracts change.
- Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm audit --audit-level=high` before release. CI is the required gate when local installation prevents those checks.
- Do not force major dependency changes to silence advisories without compatibility review and regression checks.
- Do not remove code or reorganize directories based only on apparent non-use; confirm repository and deployment references first.

## Security invariants

- A client-side token, route guard, React role, or `User-Agent` is not an identity or authorization boundary.
- Verify identity and authorization server-side before granting access or using privileged credentials. The Hub token issuer/verification contract is currently undocumented; do not mark its user as approved or admin.
- Firestore rules must remain default-deny and independently enforce ownership and role checks.
- Redact secrets before every output sink, including browser console, persisted logs, and telemetry.

## Operational evidence

- Keep the docs in `docs/` aligned with the implemented behavior, supported runtime, environment variables, and deployment mode.
- Report exact commands and outcomes. Distinguish checks that ran from checks blocked by missing dependencies or external services.