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
*   `server/src/app.ts`: Exports `app`, configures middleware (CORS, JSON), and basic error handling.
*   `server/src/server.ts`: Imports `app` and `env`, starts the server on `env.PORT`.
*   All relative imports MUST use `.js` extensions per NodeNext rules.

### Client Setup (Vite + Tailwind v4)
*   React 19 + Vite.
*   Tailwind v4: No `tailwind.config.js`. CSS-first configuration via `@import "tailwindcss"` in `index.css`.
*   `vite.config.ts` must import and register the `@tailwindcss/vite` plugin — without it, Tailwind v4 will not process styles.

### Testing & Linting
*   **Vitest:** Configured in `server` and `client`.
*   **ESLint:** Flat config (`eslint.config.js`) supporting React and TypeScript.
*   **Prettier:** Standard project-wide formatting.

## 4. Implementation Steps
1.  **Initialize Root:** Create root `package.json`, root `tsconfig.json`, and basic workspace folders.
2.  **Shared Workspace:** Define `types.d.ts` and `models.ts` boilerplate.
3.  **Server Workspace:**
    *   Install Express 5, TypeScript, Zod, Vitest, Supertest.
    *   Implement `env.ts` validation logic.
    *   Implement `app.ts` (with health check) and `server.ts`.
    *   Add basic unit test to verify Express setup.
4.  **Client Workspace:**
    *   Scaffold Vite + React 19.
    *   Initialize Tailwind CSS v4 in `index.css`.
    *   Add basic smoke test with Vitest.
5.  **Scripts Workspace:** Initialize folder structure and `tsconfig.json` only.
6.  **CI/Validation:** Configure top-level scripts to run linting, type-checking, and tests across the monorepo.

## 5. Verification (Done Criteria)
- [ ] `npm run lint` passes across all workspaces.
- [ ] `npm run typecheck` passes (NodeNext resolution verified).
- [ ] `npm run test` passes with at least one unit test in both `server` and `client`.
- [ ] Server starts successfully and responds to a `/health` check.
- [ ] Client builds and displays a "Heritage Odyssey" placeholder.
