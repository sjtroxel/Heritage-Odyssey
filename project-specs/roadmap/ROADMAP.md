# Heritage Odyssey Roadmap

| Phase | Name | Duration | Key Goal |
| :--- | :--- | :--- | :--- |
| 1 | **Foundation** | 3 Days | Set up the monorepo structure and development environment. |
| 2 | **Data & RAG** | 5 Days | Implement document ingestion and vector storage via Pinecone. |
| 3 | **Agent Swarm** | 6 Days | Build the LangGraph orchestration for historical narrative generation. |
| 4 | **Voice & UI** | 5 Days | Integrate ElevenLabs/Whisper and develop the frontend interface. |
| 5 | **Evaluation** | 4 Days | Implement Ragas/TruLens for validation of historical accuracy. |
| 6 | **Deployment & Launch** | 2 Days | Finalize production deployment and verify platform stability. |

---

## Detailed Phase Breakdown

### Phase 1: Foundation
*   **Deliverables:**
    1. Monorepo workspace configuration (`server`, `client`, `shared`).
    2. Express 5 boilerplate with `app.ts`/`server.ts` split.
    3. Vite + React 19 frontend boilerplate.
    4. Linting/type-checking (ESLint, Prettier, TypeScript `strict: true`) suite.
    5. Unit testing framework (Vitest) configuration with mocks.
    6. Environment variable validation schema (e.g., using Zod).
*   **Risks:** Ensuring `NodeNext` resolution is strictly followed across workspaces to avoid module errors.
*   **Done:** All local development environments are initialized, passing lint/type checks, and running base unit tests.

### Phase 2: Data & RAG
*   **Deliverables:**
    1. Pinecone project and index creation.
    2. Historical document ingestion script.
    3. Document parsing/chunking logic.
    4. Embedding generation service (Model: TBD).
    5. Vector store search/retrieval service.
    6. Data integrity/schema mapping logic.
*   **Risks:** Ensuring accurate retrieval of historical context; managing embedding token costs.
*   **Done:** A populated Pinecone index that supports semantic search of historical documents with verified retrieval latency.

### Phase 3: Agent Swarm
*   **Deliverables:**
    1. LangGraph environment setup.
    2. Primary "Narrator" agent definition.
    3. "Researcher" agent with historical data access.
    4. "Synthesizer" agent for emotional storytelling.
    5. State management schema for LangGraph.
    6. Tool definitions for historical query handling.
    7. Prompt templates for historical and emotional accuracy.
*   **Risks:** Preventing "hallucinations" in historical narratives; agent loop optimization.
*   **Done:** The multi-agent swarm successfully orchestrates a research-to-narrative pipeline based on an example historical query.

### Phase 4: Voice & UI
*   **Deliverables:**
    1. OpenAI Whisper STT integration.
    2. ElevenLabs TTS integration.
    3. Frontend audio streaming component.
    4. Mobile-responsive React 19 UI (Tailwind v4).
    5. Query input mechanism (voice/text).
    6. Narrative output visualization.
*   **Risks:** Latency in audio generation/streaming; cross-platform audio compatibility.
*   **Done:** A user can speak/type a prompt, and the app successfully plays back an audio-narrated historical response in the UI.

### Phase 5: Evaluation
*   **Deliverables:**
    1. Ragas/TruLens evaluation framework setup.
    2. Test dataset creation (Historical query/answer pairs).
    3. "Accuracy" evaluation module.
    4. "Retrieval" quality scoring module.
    5. Automated evaluation report generator.
*   **Risks:** Defining "ground truth" for subjective oral-history-style narratives.
*   **Done:** The system has an automated evaluation suite that provides measurable quality scores for retrieval and historical factual alignment.

### Phase 6: Deployment & Launch
*   **Deliverables:**
    1. Final production security audit.
    2. Railway configuration for Express backend.
    3. Vercel configuration for React + Vite frontend.
    4. E2E tests (Playwright) covering user flow.
    5. Production environment variable management.
    6. Final performance and load testing.
*   **Risks:** Environment differences between staging/prod; CORS and deployment-specific security configs.
*   **Done:** The application is deployed and accessible in a production environment with all E2E tests passing.

---

## Post-Roadmap Documentation

After all phase planning documents are complete, write `project-specs/docs/API_INTEGRATIONS.md` covering: ElevenLabs, OpenAI Whisper, Pinecone, LangGraph, and Ragas/TruLens. Writing it after the phase docs ensures implementation-specific details (exact methods, endpoints, SDK patterns) are captured accurately rather than generically.
