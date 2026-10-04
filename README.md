# SourceFinder Pod

SourceFinder Pod is a Next.js application for AI-assisted research and podcast production. Its interface includes source discovery, orchestration, script writing, podcast creation, storyboards, summaries, and related tools. Backend API routes are implemented under `app/api/`.

## Requirements

- Node.js `24.x`
- npm `11.x`
- Environment configuration based on `.env.example`

These runtime and package-manager ranges are declared in `package.json`. Do not commit local environment files or Firebase service credentials.

## Setup and development

```bash
npm ci
npm run dev
```

The development script binds Next.js to `0.0.0.0:3000`.

## Environment configuration

Use `.env.example` as the variable-name reference:

- `GEMINI_API_KEY` and Firebase Admin credentials are server-side values and must remain private.
- `VERTEX_AI`, `USE_VERTEX_AI`, `VERTEX_PROJECT_ID`, and `VERTEX_LOCATION` control or configure the server-side Vertex AI integration. Verify the runtime environment before assuming which provider mode is active.
- `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_CLOUD_RUN_REGION` are public configuration and can be included in browser output. Never store private credentials in `NEXT_PUBLIC_*`.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run the TypeScript check (`tsc --noEmit`). |
| `npm test` | Run the Vitest suite once. |
| `npm run build` | Build Next.js standalone output and run repository build validation scripts. |
| `npm start` | Start `.next/standalone/server.js`. |
| `npm run clean` | Run `next clean`. |

## Project layout

- `app/` contains the Next.js pages and API route handlers.
- `components/` and `hooks/` contain UI and client-side behavior.
- `lib/` contains Firebase, AI provider, validation, logging, and orchestration utilities.
- `__tests__/` contains Vitest test files.

## Validation

Run the checks appropriate to your change:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The API routes can invoke paid external AI services. Confirm server-side authentication, authorization, input limits, provider configuration, and cost controls in the implementation and deployed environment; a configured key or route alone does not demonstrate those controls are effective.

## Google Conversational Agents (CES)

No CES `runSession` integration was found in this repository. The supplied cURL is a reference request, not evidence that the app is connected.

When adding the integration, use a server-side API route and Google server credentials such as ADC or workload identity; never call CES from browser code or expose credentials through `NEXT_PUBLIC_*`. Keep the project, location, app, version, and deployment identifiers in server-only configuration (for example, `CES_PROJECT_ID`, `CES_LOCATION`, `CES_APP_ID`, `CES_APP_VERSION_ID`, and `CES_DEPLOYMENT_ID`). Do not share a static session ID between users. Verify session creation, ownership, expiration, minimum IAM permissions, and retention before implementation.
