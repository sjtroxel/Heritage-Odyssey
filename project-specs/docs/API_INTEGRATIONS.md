# API Integrations Reference

This document serves as the central technical reference for all third-party API and SDK integrations within the Heritage Odyssey project. Developers should refer to this guide for SDK implementation details, environment requirements, and known architectural constraints.

---

## ElevenLabs (TTS)

- **SDK Package:** `elevenlabs`
- **Versioning:** Pin exact version at installation time (no ranges).
- **Primary Methods:** `elevenlabs.generate({ stream: true, ... })`
- **Environment Variables:**
  - `ELEVENLABS_API_KEY`: Authentication for the ElevenLabs API.
  - `ELEVENLABS_VOICE_ID`: The specific voice ID selected for the narrator.
- **Implementation Strategy:**
  - **Streaming:** The backend uses the ElevenLabs SDK to generate a `ReadableStream`. This stream is piped directly to the Express `res` object.
  - **Headers:** Responses must include `Content-Type: audio/mpeg`.
- **Documentation:** [ElevenLabs API Reference](https://elevenlabs.io/docs/api-reference)

---

## OpenAI (Models, STT, Embeddings)

- **SDK Packages:** 
  - `openai` (used for direct Whisper-1 STT calls)
  - `@langchain/openai` (used for LangGraph agents and embeddings)
- **Versioning:** Pin exact versions at installation time (no ranges).
- **Environment Variables:**
  - `OPENAI_API_KEY`: Unified key for all OpenAI services.

### 1. Agent Swarm (Orchestration)
- **Methods:** `ChatOpenAI` from `@langchain/openai`.
- **Models:**
  - **Researcher & Narrator:** `gpt-4o` (high reasoning, factual consistency).
  - **Synthesizer:** `gpt-4o-mini` (cost-efficient creative drafting).

### 2. Voice-to-Text (STT)
- **Methods:** `openai.audio.transcriptions.create`
- **Model:** `whisper-1`
- **Gotchas:**
  - **iOS Compatibility:** iOS `MediaRecorder` defaults to AAC/MP4. The frontend must detect supported MIME types (WebM vs. AAC/MP4) using `MediaRecorder.isTypeSupported` and pass the correct format to the transcription endpoint.
  - **Server Handling:** Uses `multer` middleware to handle `multipart/form-data` audio uploads.

### 3. RAG Pipeline (Embeddings)
- **Methods:** `OpenAIEmbeddings` from `@langchain/openai`.
- **Model:** `text-embedding-3-small`
- **Configuration:** 1536 dimensions.
- **Batching:** The `ingest.ts` script should batch embed chunks (max 100 per request) to optimize performance and rate limits.

- **Documentation:** [OpenAI Documentation](https://platform.openai.com/docs/)

---

## Pinecone (Vector Database)

- **SDK Package:** `@pinecone-database/pinecone`
- **Versioning:** Pin exact versions at installation time (no ranges).
- **Primary Methods:** `index.query`, `index.upsert`
- **Environment Variables:**
  - `PINECONE_API_KEY`: Authentication.
  - `PINECONE_ENVIRONMENT`: Index environment (e.g., `us-east-1`).
  - `PINECONE_INDEX`: Name of the serverless index.
- **Architectural Details:**
  - **Metric:** `cosine`.
  - **Dimensions:** 1536 (must match `text-embedding-3-small`).
  - **Metadata:** Indexing supports `source_type`, `title`, `year`, and `region` for filtered agent searches.
- **Documentation:** [Pinecone Documentation](https://docs.pinecone.io/)

---

## LangGraph & LangChain (Orchestration)

- **SDK Packages:**
  - `@langchain/langgraph`: Agent state and graph orchestration.
  - `@langchain/textsplitters`: Document processing in the ingestion pipeline.
- **Versioning:** Pin exact versions at installation time (no ranges).
- **Primary Classes:** `Annotation.Root`, `StateGraph`, `RecursiveCharacterTextSplitter`.
- **Environment Variables:**
  - `LANGCHAIN_TRACING_V2`: Enable for LangSmith debugging (Development only).
- **Implementation Gotchas:**
  - **NodeNext Resolution:** Because the project uses `module: NodeNext`, all relative imports in agent files MUST include the `.js` extension.
  - **Loop Control:** The `StateGraph` includes a hard-coded limit of 3 iterations (tracked in `AgentState.iterationCount`) to prevent infinite loops during fact-checking.
- **Documentation:** [LangGraph.js](https://langchain-ai.github.io/langgraphjs/)

---

## Ragas & TruLens (Evaluation)

- **Language:** Python 3.9+ (Managed in `/evaluation` directory).
- **Packages:** `ragas`, `trulens-eval` (pinned in `evaluation/requirements.txt`).
- **Metrics:** `faithfulness`, `answer_relevance`, `context_precision`.
- **Environment Variables:**
  - `EVAL_MODE=true`: Activated on the Node.js server to enable trace logging via `evalService.ts`.
- **Implementation Strategy:**
  - **Decoupling:** The evaluation suite runs as an offline Python process to keep the Node.js production image lean.
  - **ESM Path Resolution:** The `evalService.ts` in the server must resolve the absolute path to the `evaluation/traces/` directory using `import.meta.url` (via `fileURLToPath`) because `__dirname` is unavailable in ESM.
- **Documentation:** [Ragas](https://docs.ragas.io/), [TruLens](https://www.trulens.org/)
