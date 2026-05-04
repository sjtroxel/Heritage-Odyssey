# Phase 3 Plan: Data & RAG

## 1. Objective
Build the historical knowledge foundation by sourcing diverse migration data, processing it into optimized chunks, and creating a robust retrieval service using Pinecone and OpenAI.

## 2. Data Sourcing Strategy
All raw data will be stored in `scripts/data/` (gitignored).

### Source A: Project Gutenberg (Narrative/Context)
*   **Target:** 5–10 public domain books on 19th/20th-century immigration (e.g., Mary Antin's *The Promised Land*, Edward Steiner's *On the Trail of the Immigrant*).
*   **Format:** Plain text (`.txt`).
*   **Method:** Manual download to `scripts/data/gutenberg/`.

### Source B: Library of Congress (Events/Newspapers)
*   **Target:** Newspaper articles from 1880–1920 containing keywords like "steerage," "Ellis Island," "migration," "homestead."
*   **Method:** `scripts/src/fetch-loc.ts` using the [Chronicling America API](https://chroniclingamerica.loc.gov/about/api/).
*   **Format:** JSON responses stored in `scripts/data/loc/`.

### Source C: Our World in Data (Macro Trends)
*   **Target:** Migration CSVs (e.g., "Migration by origin and destination," "Number of international migrants").
*   **Method:** Convert CSV rows into descriptive text summaries (e.g., "In 1890, the net migration rate for region X was Y%") via a conversion script.
*   **Format:** Text summaries in `scripts/data/owid/`.

## 3. Vector Infrastructure

### Pinecone Configuration
*   **Index Type:** Serverless.
*   **Metric:** `cosine`.
*   **Dimension:** 1536 (optimized for `text-embedding-3-small`).
*   **Metadata Schema:**
    *   `text`: The raw chunk content.
    *   `source_type`: `gutenberg` | `loc` | `owid`.
    *   `title`: Source document name.
    *   `year`: Approximate era/year (if available).
    *   `region`: Geographic focus.

### Processing Pipeline
*   **Embeddings:** OpenAI `text-embedding-3-small`.
*   **Chunking:** `RecursiveCharacterTextSplitter` from `@langchain/textsplitters`.
    *   `chunkSize`: 1000.
    *   `chunkOverlap`: 200.

## 4. Technical Implementation

### Ingestion Pipeline (`scripts/src/ingest.ts`)
1.  **Iterate:** Walk through `scripts/data/` subfolders.
2.  **Clean:** Remove Gutenberg headers/footers and LOC boilerplate.
3.  **Split:** Use `RecursiveCharacterTextSplitter` for semantic boundaries.
4.  **Embed:** Batch embed chunks (max 100 per request) via OpenAI.
5.  **Upsert:** Write to Pinecone with full metadata.

### Server Services
*   **\`server/src/services/embedding.ts\`**: Wrapper for \`openai.embeddings.create\`.
*   **\`server/src/services/vectorStore.ts\`**:
    *   \`query(text: string, filter?: object)\`: Performs the similarity search.
    *   Implements metadata filtering to allow agents to scope searches (e.g., "only search 1890s data").
*   **\`server/tests/services/vectorStore.test.ts\`**: Vitest unit tests that mock the Pinecone client and verify that \`vectorStore.query\` returns the expected shape (id, score, metadata) and that year and region metadata filters are correctly passed through to the Pinecone query call.

## 5. Implementation Steps
1.  **Setup Index:** Manually create the Pinecone serverless index.
2.  **Collect Data:** Download Gutenberg texts and implement the LOC fetcher script.
3.  **Process OWID:** Implement CSV-to-Text summary conversion logic.
4.  **Ingestion Script:** Implement the main \`ingest.ts\` with LangChain splitters.
5.  **Server Services:** Implement \`embedding.ts\` and \`vectorStore.ts\` in the backend.
6.  **Verification Test:** A script that queries "Life at Ellis Island" and returns a relevant Gutenberg/LOC mix.

## 6. Verification (Done Criteria)
- [ ] \`scripts/data/\` contains at least 50MB of diverse historical data.
- [ ] \`npm run ingest\` completes without errors, and Pinecone shows >1000 vectors.
- [ ] \`vectorStore.query\` returns top-5 matches with metadata in <500ms.
- [ ] Embeddings use \`text-embedding-3-small\` with 1536 dimensions.
- [ ] \`vectorStore.query\` unit tests pass with a mocked Pinecone client, verifying filter passthrough and response shape.

