# Phase 2 Plan: Database & Auth

## 1. Objective
Establish a secure, persistent data layer using Neon PostgreSQL and implement JWT-based authentication to enable user-specific ancestor profiles and saved narratives.

## 2. Architectural Decision: Drizzle-ORM & postgres.js
- **Decision:** Use **Drizzle-ORM** with the **postgres.js** driver.
- **Reasoning:** Drizzle-ORM provides a lightweight, type-safe SQL-like abstraction that is fully compatible with `NodeNext` module resolution and monorepo structures. It avoids the heavy runtime overhead and complex code generation of Prisma. `postgres.js` is a high-performance, reliable driver that integrates seamlessly with Neon's serverless and pooled environments.

## 3. Implementation Steps
1. **Database Setup:** Provision a Neon PostgreSQL instance and configure connection pooling.
2. **Schema Definition:** Define the database schema using Drizzle:
    - `users`: `id`, `email`, `password_hash`, `created_at`.
    - `ancestor_profiles`: `id`, `user_id`, `name`, `birth_region`, `era`, `created_at`.
    - `saved_narratives`: `id`, `user_id`, `ancestor_profile_id`, `content_text`, `created_at`.
3. **Migrations:** Configure `drizzle-kit` for schema migrations and versioning.
4. **JWT Authentication:**
    - Implement `POST /api/auth/signup` (password hashing with `bcrypt`).
    - Implement `POST /api/auth/login` (issue Access and Refresh tokens).
    - Implement `POST /api/auth/logout` (invalidate/clear tokens).
    - Implement `POST /api/auth/refresh` (rotate tokens).
5. **Auth Middleware:** Create `server/src/middleware/auth.ts` to verify JWTs and protect narrative/profile routes.
6. **Shared Types:** Define `User`, `AuthResponse`, and related types in `shared/types.d.ts`.

## 4. Key Files
- `server/src/db/schema.ts`: Drizzle schema definitions.
- `server/src/db/index.ts`: Database client and connection pooling.
- `server/src/middleware/auth.ts`: JWT verification middleware.
- `server/src/controllers/authController.ts`: Auth endpoint logic.
- `shared/types.d.ts`: Shared authentication and user types.
- `server/tests/unit/auth.test.ts`: Supertest unit tests for auth endpoints.

## 5. Verification (Done Criteria)
- [ ] Schema migrations run successfully against a local or development Neon instance.
- [ ] `signup` and `login` endpoints correctly issue valid JWTs.
- [ ] `auth.ts` middleware successfully blocks unauthenticated requests to protected routes.
- [ ] `refresh` endpoint successfully rotates tokens.
- [ ] All auth endpoints have 80%+ test coverage via Supertest with a mocked database.
- [ ] Authenticated users can successfully create an ancestor profile and save a narrative.
