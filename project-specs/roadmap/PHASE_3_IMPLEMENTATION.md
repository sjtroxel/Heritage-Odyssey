# Phase 3 Implementation Plan: Data & RAG

This document outlines the specific implementation steps for Phase 3: Data & RAG. This phase builds the historical knowledge foundation using Pinecone, OpenAI embeddings, and diverse data sources.

## Prerequisites & Human Tasks

### Mandatory Project Documentation
- **Task:** Create `project-specs/docs/NARRATIVE_RUBRIC.md` per the note in `PHASE_2_DATABASE_AUTH.md`. This must define the 5-point scale and golden examples for narrative quality.

### External Services (Human-Only)
- **Pinecone:** Create a **Serverless Index** in the Pinecone console.
  - **Dimensions:** 1536
  - **Metric:** `cosine`
  - **Cloud/Region:** us-east-1 (or preferred AWS/GCP region)
- **Environment:** Add `PINECONE_API_KEY` and `PINECONE_INDEX` to `server/.env` and `.env.example`.

### Data Collection (Human-Only)
- **Gutenberg:** Manually download 5–10 plain text (`.txt`) books on immigration to `scripts/data/gutenberg/`.
- **OWID:** Manually download migration CSVs from Our World in Data to `scripts/data/owid/raw/`.

---

## Step 1 — Install packages in scripts and server workspaces
- **Files to Modify:**
  - `.env.example` (Add `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`)
  - `scripts/package.json` (Add scripts: `fetch-loc`, `convert-owid`, `ingest`)
  - `.gitignore` (Add `scripts/data/` to prevent committing large data files)
- **Packages (Scripts):**
  - `npm install -w scripts openai @pinecone-database/pinecone @langchain/textsplitters csv-parse dotenv`
- **Packages (Server):**
  - `npm install -w server openai @pinecone-database/pinecone`

**Note:** `scripts/data/` must be added to `.gitignore` since historical data files are too large and contain raw source material that should not be committed to the repository.

**STOP HERE — await review**

## Step 2 — LOC fetcher script (scripts/src/fetch-loc.ts)
- **Files to Create:**
  - `scripts/src/fetch-loc.ts` (Implementation using Chronicling America API)
- **Actions:**
  - Fetch metadata and snippets for keywords: "steerage", "Ellis Island", "migration", "homestead".
  - Save results as JSON in `scripts/data/loc/`.

**STOP HERE — await review**

## Step 3 — OWID CSV converter (scripts/src/convert-owid.ts)
- **Files to Create:**
  - `scripts/src/convert-owid.ts` (CSV to structured text summary converter)
- **Actions:**
  - Parse CSVs from `scripts/data/owid/raw/`.
  - Transform rows into descriptive strings (e.g., "In 1910, the migration rate for Italy was...")
  - Save as `.txt` or `.json` in `scripts/data/owid/processed/`.

**STOP HERE — await review**

## Step 4 — Main ingest pipeline (scripts/src/ingest.ts)
- **Files to Create:**
  - `scripts/src/ingest.ts` (Orchestrates cleaning, splitting, embedding, and upserting)
- **Logic:**
  - Load data from `gutenberg/`, `loc/`, and `owid/`.
  - Use `RecursiveCharacterTextSplitter` (1000/200).
  - Batch embed using `text-embedding-3-small`.
  - Upsert to Pinecone with metadata (`source_type`, `year`, `region`, etc.).

**STOP HERE — await review**

## Step 5 — Server services (embedding.ts + vectorStore.ts)
- **Files to Create:**
  - `server/src/services/embedding.ts` (OpenAI embedding wrapper)
  - `server/src/services/vectorStore.ts` (Pinecone query implementation with metadata filters)
- **Logic:**
  - `vectorStore.query` should accept filters for `year` and `region`.

**STOP HERE — await review**

## Step 6 — vectorStore tests + full CI check
- **Files to Create:**
  - `server/tests/vectorStore.test.ts` (Unit tests with mocked Pinecone client)
- **Actions:**
  - **Human Task:** Run `npm run ingest` to populate the real index for manual verification.
  - Run full validation suite: `npm run typecheck && npm run lint && npm run test && npm run coverage && npm run build`
  - Verify `vectorStore.query` returns expected results and correctly handles filters.

**STOP HERE — await review**
