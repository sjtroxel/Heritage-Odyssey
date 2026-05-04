# Phase 1 Implementation Plan: Foundation

This document outlines the specific implementation steps, packages, and architectural decisions for the Foundation phase of Heritage Odyssey.

## 1. Project Initialization & Monorepo Structure
- **Files to Create:**
  - `package.json` (Root)
  - `tsconfig.json` (Root - NodeNext/Strict)
  - `.gitignore`
  - `.prettierrc`
  - `eslint.config.js`
  - `.env.example`
- **Packages (Root Dev):**
  - `typescript`
  - `eslint`
  - `prettier`
  - `husky`
  - `lint-staged`

## 2. Shared Workspace (`shared/`)
- **Files to Create:**
  - `shared/package.json`
  - `shared/tsconfig.json`
  - `shared/types.d.ts` (Domain types)
  - `shared/models.ts` (AI model constants)

## 3. Server Workspace (`server/`)
- **Files to Create:**
  - `server/package.json`
  - `server/tsconfig.json`
  - `server/src/app.ts` (Express app logic)
  - `server/src/server.ts` (Server entry point)
  - `server/src/config/env.ts` (Zod env validation)
  - `server/src/services/logger.ts` (Pino logger)
  - `server/src/middleware/validate.ts` (Zod validation middleware)
  - `server/tests/app.test.ts` (Supertest smoke test)
- **Packages (Dependencies):**
  - `express@5.0.0-beta.3`
  - `zod`
  - `pino`
  - `pino-pretty`
  - `helmet`
  - `express-rate-limit`
  - `cors`
  - `dotenv`
- **Packages (Dev):**
  - `vitest`
  - `supertest`
  - `@types/express`
  - `@types/cors`
  - `@types/node`

## 4. Client Workspace (`client/`)
- **Files to Create:**
  - `client/package.json`
  - `client/tsconfig.json`
  - `client/vite.config.ts`
  - `client/index.html`
  - `client/src/main.tsx`
  - `client/src/App.tsx`
  - `client/src/index.css`
  - `client/tests/App.test.tsx`
- **Packages (Dependencies):**
  - `react`
  - `react-dom`
  - `lucide-react`
- **Packages (Dev):**
  - `vite`
  - `@vitejs/plugin-react`
  - `tailwindcss`
  - `@tailwindcss/vite`
  - `vitest`
  - `@testing-library/react`
  - `jsdom`

## 5. Scripts Workspace (`scripts/`)
- **Files to Create:**
  - `scripts/package.json`
  - `scripts/tsconfig.json`
  - `scripts/src/.gitkeep`

## 6. Architectural Decisions
- **NodeNext Module Resolution:** Strict ESM compliance requiring `.js` extensions on all relative imports.
- **Express 5 (Beta):** Native support for async error handling and modern Express features.
- **Tailwind v4 (CSS-first):** Utilizing `@theme` and `@import "tailwindcss"` without a legacy config file.
- **Strict TypeScript:** `strict: true` and `noUncheckedIndexedAccess: true` to prevent common runtime errors.
- **Security Defaults:** Global application of `helmet` and `express-rate-limit` from day one.
- **Structured Logging:** `pino` for high-performance, machine-readable logs.

## 7. Git & CI Integration
- **Husky/lint-staged:** Automated linting and formatting on every commit.
- **Gitleaks:** Integrated into pre-commit hook to prevent credential leakage.
- **Monorepo Scripts:** Root-level `lint`, `typecheck`, and `test` commands that orchestrate workspace execution.
