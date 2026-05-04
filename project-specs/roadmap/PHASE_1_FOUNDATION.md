# Phase 1 Plan: Foundation

## 1. Objective
Establish the monorepo structure, development environment, and core service boilerplates for Heritage Odyssey, ensuring strict adherence to the project's technical constraints (`NodeNext`, `strict` TypeScript, `app.ts`/`server.ts` split).

## 2. Monorepo Structure
The project will use `npm workspaces` with the following structure:
```text
heritage-odyssey/
├── package.json                 # Root workspace config
├── tsconfig.json                # Base NodeNext/strict settings
├── .gitignore
├── .prettierrc
├── eslint.config.js             # Project-wide ESLint
├── shared/                      # Shared types and constants
│   ├── package.json
│   ├── tsconfig.json            # Extends root
│   ├── types.d.ts               # Shared types (.d.ts)
│   └── models.ts                # AI Model constants
├── server/                      # Express 5 Backend
│   ├── package.json
│   ├── tsconfig.json            # Extends root
│   ├── src/
│   │   ├── app.ts               # Express app (no listen)
│   │   ├── server.ts            # Entry point (calls listen)
│   │   ├── config/
│   │   │   └── env.ts           # Zod env validation
│   │   └── services/
│   │       └── logger.ts            # Structured request/app logger (pino)
│   └── tests/                   # Vitest unit/integration tests
├── client/                      # React 19 + Vite Frontend
│   ├── package.json
│   ├── tsconfig.json            # Extends root
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── index.css            # @import "tailwindcss"
│   └── tests/                   # Vitest unit tests
├── scripts/                     # Ingestion scripts workspace
│   ├── package.json
│   ├── tsconfig.json            # Extends root
│   └── src/                     # Empty for Phase 1
└── project-specs/               # Documentation
```

## 3. Configuration Details

### Root `tsconfig.json`
*   `module: NodeNext`, `moduleResolution: NodeNext`, `target: ESNext`, `strict: true`, `noUncheckedIndexedAccess: true`.
*   Workspace configs extend this to ensure consistency.

### Root `package.json`
*   `workspaces`: `["server", "client", "shared", "scripts"]`
*   Scripts for `lint`, `typecheck`, and `test` that run across all workspaces.

### Environment Variable Validation (Server)
*   Use `zod` in `server/src/config/env.ts` to validate:
    *   `PORT` (default 3000)
    *   `DATABASE_URL` (Neon PostgreSQL)
    *   `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, `PINECONE_INDEX`
    *   `ELEVENLABS_API_KEY`
    *   `OPENAI_API_KEY` (for Whisper)
    *   `JWT_SECRET`

### Express 5 Setup
*   `server/src/app.ts`: Exports `app`, configures middleware (CORS, JSON, helmet, rate-limit), and basic error handling.
*   **helmet**: Applied globally in `app.ts` to set secure HTTP response headers.
*   **express-rate-limit**: Applied globally with a sensible default (e.g., 100 req / 15 min). AI endpoints are expensive — leaving them unprotected through Phase 6 is a cost risk during ingestion testing.
*   **Zod request validation middleware**: A reusable `validate(schema)` middleware factory in `server/src/middleware/validate.ts` that validates `req.body` against a Zod schema and returns a typed 400 error on failure. Used for all POST/PUT routes from Phase 2 onward.
*   `server/src/server.ts`: Imports `app` and `env`, starts the server on `env.PORT`.
*   All relative imports MUST use `.js` extensions per NodeNext rules.

### Structured Logger
*   `server/src/services/logger.ts`: Thin wrapper around `pino`. Exports a single `logger` instance used across all server modules.
*   Do not use `console.log` anywhere in server code — use `logger.info`, `logger.warn`, `logger.error`.
*   Phase 6 eval tracing will build on this logger; establishing the convention now avoids a retroactive refactor.

### Client Setup (Vite + Tailwind v4)
*   React 19 + Vite.
*   Tailwind v4: No `tailwind.config.js`. CSS-first configuration via `@import "tailwindcss"` in `index.css`.
*   `vite.config.ts` must import and register the `@tailwindcss/vite` plugin — without it, Tailwind v4 will not process styles.

### Testing & Linting
*   **Vitest:** Configured in `server` and `client`.
*   **ESLint:** Flat config (`eslint.config.js`) supporting React and TypeScript.
*   **Prettier:** Standard project-wide formatting.
*   **Husky + lint-staged:** Pre-commit hook that runs ESLint and Prettier on staged files only. gitleaks: Secret scanning tool run as a pre-commit hook to prevent accidental credential commits.

## 4. Implementation Steps
1.  **Initialize Root:** Create root `package.json`, root `tsconfig.json`, and basic workspace folders.
2.  **Shared Workspace:** Define `types.d.ts` and `models.ts` boilerplate.
3.  **Server Workspace:**
    *   Install Express 5, TypeScript, Zod, Vitest, Supertest.
    *   Install `helmet`, `express-rate-limit`, `pino`.
    *   Implement `env.ts` validation logic.
    *   Implement `server/src/services/logger.ts` (pino instance, exported as `logger`).
    *   Implement `server/src/middleware/validate.ts` (Zod schema middleware factory).
    *   Implement `app.ts` (with health check) and `server.ts`.
    *   Wire `helmet()` and `rateLimit()` into `app.ts` before route registration.
    *   Add basic unit test to verify Express setup.
4.  **Client Workspace:**
    *   Scaffold Vite + React 19.
    *   Initialize Tailwind CSS v4 in `index.css`.
    *   Add basic smoke test with Vitest.
5.  **Scripts Workspace:** Initialize folder structure and `tsconfig.json` only.
6.  **CI/Validation:** Configure top-level scripts to run linting, type-checking, and tests across the monorepo.
7.  **Install and configure Husky and lint-staged at the monorepo root. Add a pre-commit hook that runs lint-staged (ESLint + Prettier on staged .ts and .tsx files) and gitleaks.**

## 5. Verification (Done Criteria)
- [ ] `npm run lint` passes across all workspaces.
- [ ] `npm run typecheck` passes (NodeNext resolution verified).
- [ ] `npm run test` passes with at least one unit test in both `server` and `client`.
- [ ] Server starts successfully and responds to a `/health` check.
- [ ] Client builds and displays a "Heritage Odyssey" placeholder.
- [ ] `app.ts` applies `helmet` and `express-rate-limit` — verified by inspecting response headers on `/health`.
- [ ] `server/src/services/logger.ts` exports a `pino` logger instance; no `console.log` calls exist in server source files.
- [ ] A deliberate pre-commit attempt with a staged secret (e.g., a fake API key pattern) is blocked by gitleaks.
- [ ] git commit with a staged .ts file triggers lint-staged and the file is linted before the commit proceeds.
