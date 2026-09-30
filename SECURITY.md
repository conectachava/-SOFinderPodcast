# Security Policy

## Supported deployment baseline

- Use Node.js 24.x and npm 11.x as declared by `package.json`.
- Install from the lockfile with `npm ci` and run the GitHub Actions quality workflow before deployment.
- Keep server credentials in the deployment secret manager or local ignored `.env` files. Values beginning with `NEXT_PUBLIC_` are public browser configuration and must never contain secrets.
- Firestore rules are a separate authorization boundary; keep the default-deny catch-all in `firestore.rules`.

## Known production blockers

- The callback stores a Hub-provided token in browser `localStorage`. This repository does not define the token issuer or a server-side verifier. Until that contract is integrated and tested, the token is not a trusted identity.
- API routes do not consistently verify identity. The `User-Agent` denylist in `lib/middleware.ts` only blocks trivial scanners and is not authentication, rate limiting, or cost protection. Do not expose AI-backed routes publicly without server-side identity, authorization, request limits, and abuse monitoring.
- Client-side roles are display state only. They must not authorize sensitive operations.
- The root Firebase CLI is pinned by the lockfile to the patched 15.x line. Scoped npm overrides keep its Pub/Sub and gRPC dependencies on patched versions without changing application runtime dependencies. The current lockfile reports zero vulnerabilities with `npm audit`.

## Reporting

Do not publish exploitable details or credentials in a public issue. Report privately to the repository maintainers through the hosting provider's private vulnerability-reporting channel. The repository does not currently declare a dedicated security contact.

## Release checks

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm audit --audit-level=high`. A successful dependency audit does not replace review of authentication, authorization, abuse limits, and Firestore rules.