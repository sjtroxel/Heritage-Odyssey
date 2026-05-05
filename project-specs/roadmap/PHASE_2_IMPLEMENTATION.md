# Phase 2 Implementation Plan: Database & Auth

This document outlines the specific implementation steps, packages, and architectural decisions for Phase 2: Database & Auth. This phase establishes the persistent data layer using Neon PostgreSQL and Drizzle-ORM, and implements a JWT-based authentication system.

## Step 1 — Install packages and update .env.example
- **Files to Modify:**
  - `.env.example` (Add `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`)
- **Packages (Server - Dependencies):**
  - `npm install -w server drizzle-orm postgres bcrypt jsonwebtoken cookie-parser`
- **Packages (Server - DevDependencies):**
  - `npm install -w server -D drizzle-kit @types/bcrypt @types/jsonwebtoken @types/cookie-parser`

**STOP HERE — await review**

## Step 2 — DB schema and shared types
- **Files to Create:**
  - `server/src/db/schema.ts` (Drizzle schema definitions)
  - `server/src/db/index.ts` (Database client initialization)
- **Files to Modify:**
  - `shared/types.d.ts` (Add User, Auth, and Request/Response types)
- **Tables to Define:**
  - `users`
  - `ancestor_profiles`
  - `saved_narratives`
  - `model_usage`

**STOP HERE — await review**

## Step 3 — Drizzle-kit config and migration generation
- **Files to Create:**
  - `server/drizzle.config.ts`
- **Files to Modify:**
  - `server/package.json` (Add `db:generate`, `db:push`, `db:studio` scripts)
- **Actions:**
  - Generate initial migration files using `drizzle-kit generate`.

**STOP HERE — await review**

## Step 4 — Auth controller (all 4 endpoints)
- **Files to Create:**
  - `server/src/controllers/authController.ts`
- **Endpoints to Implement:**
  - `signup` (Password hashing, user creation)
  - `login` (Credential verification, issuing Access/Refresh tokens)
  - `logout` (Clearing cookies/tokens)
  - `refresh` (Token rotation)

**STOP HERE — await review**

## Step 5 — Auth middleware and route wiring
- **Files to Create:**
  - `server/src/middleware/auth.ts` (JWT verification middleware)
- **Files to Modify:**
  - `server/src/app.ts` (Register `cookie-parser`, wire up auth routes, apply middleware to protected placeholders)

**STOP HERE — await review**

## Step 6 — Auth tests, local CI check, and commit [COMPLETE]
- **Files to Create:**
  - `server/tests/auth.test.ts` (Integration tests for auth endpoints)
- **Actions:**
  - Run full validation suite: `npm run typecheck && npm run lint && npm run test && npm run coverage && npm run build`
  - Summarize changes for commit (to be performed by sjtroxel).

---

**PHASE 2 COMPLETION NOTE:** All steps for Phase 2 are complete. Database schema is established, authentication is fully functional and tested, and the CI pipeline is green. Ready for Phase 3.
