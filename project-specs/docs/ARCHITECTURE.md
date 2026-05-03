# Heritage Odyssey Architecture

## 1. Overall System Architecture
The platform follows a **Client-Server-Agent** model:
*   **Client (React 19 + Vite):** Mobile-first SPA. Public-facing with optional authenticated user sessions via JWT.
*   **Server (Express 5 API):** Orchestrates the request lifecycle, manages JWT auth, interacts with PostgreSQL/Pinecone, and interfaces with the LangGraph swarm.
*   **Database (PostgreSQL via Neon):** A lean relational layer for user data and persistent historical records.
*   **Persistence & Intelligence:** Pinecone for vector search (historical documents); PostgreSQL for user-linked records; Whisper/ElevenLabs for audio.

## 2. Monorepo Structure
*   `/client`: React 19 + Vite + Tailwind CSS v4.
*   `/server`: Node.js/Express 5 backend.
*   `/shared`: TypeScript types (`.d.ts`), shared constants, database schema.
*   `/scripts`: Pinecone historical data ingestion pipelines.
*   `/project-specs`: Roadmap and architectural documentation.

## 3. Data Storage Strategy
### PostgreSQL (via Neon)
*   `users`: `id`, `email`, `password_hash`, `created_at`.
*   `ancestor_profiles`: `id`, `user_id` (FK), `name`, `birth_region`, `era`, `created_at`.
*   `saved_narratives`: `id`, `user_id` (FK), `ancestor_profile_id` (FK), `content_text`, `created_at`.
*(Audio is regenerated on-demand; no storage needed)*

### Pinecone
*   Used for semantic retrieval of raw historical/migration documents.

## 4. Authentication Flow (JWT)
*   Standard pattern: Login/Signup endpoint issues JWT.
*   Protected routes for saving/viewing "ancestor profiles" and "saved narratives."
*   Express middleware verifies tokens before accessing PostgreSQL data.

## 5. Data Flow (Voice & Persistence)
1.  **Auth:** User authenticates (optional for exploration, required for saving).
2.  **Transcription:** Audio captured on client, sent to `/server` -> OpenAI Whisper.
3.  **Research & Generation:** LangGraph Orchestrator searches Pinecone for context and generates narrative text.
4.  **Persistence:** Server writes final narrative to `saved_narratives` (PostgreSQL) if authenticated.
5.  **Voice Output:** Server streams narrative text to ElevenLabs; audio stream returned to client.

## 6. Technology Integration
*   **LangGraph:** Orchestrates stateful research-to-narrative workflows.
*   **Pinecone:** External knowledge base, agnostic of users.
*   **PostgreSQL:** State store for user-specific history.
*   **Ragas/TruLens:** Used for validation of the AI's research-to-narrative chain.
