# Phase 4 Implementation Plan: Agent Swarm (LangGraph)

This document outlines the specific implementation steps for Phase 4: Agent Swarm. This phase implements the multi-agent orchestration layer using LangGraph to generate historically grounded narratives.

## Prerequisites
- Phase 3 (Data & RAG) must be fully complete and verified.
- Pinecone index must be populated with historical data.
- OpenAI API Key must have access to `gpt-4o` and `gpt-4o-mini`.

---

## Step 1 — Infrastructure & ModelRouter [x]
- **Files to Create:**
  - `server/src/services/modelRouter.ts` (Centralized model call wrapper)
- **Files to Modify:**
  - `server/package.json` (Install `@langchain/langgraph`, `@langchain/openai`, `@langchain/core`)
- **Logic:**
  - `modelRouter.ts` should handle ChatOpenAI calls and log usage to the `model_usage` table.
  - It should be the single point of entry for all AI model calls in the server.

**STOP HERE — await review**

## Step 2 — State Definition & Types [x]
- `shared/types.d.ts` (Add `HandoffPackage` interface)
- **Files to Create:**
  - `server/src/agents/state.ts` (LangGraph `Annotation.Root` definition)
- **Files to Modify:**
- **Logic:**
  - Define `AgentState` as described in `PHASE_4_AGENT_SWARM.md`.
  - Add `requiresRevision`, `iterationCount`, and `handoffPackage` to the state.

**STOP HERE — await review**

## Step 3 — The Researcher Agent & Tools [x]
- **Files to Create:**
  - `server/src/agents/nodes/researcher.ts` (Researcher node logic)
- **Logic:**
  - Implement a tool-like function (or use LangGraph tools) for `historical_search`.
  - The Researcher node uses `gpt-4o` to determine search queries based on the user's prompt.
  - Calls `vectorStore.query` with appropriate filters (era, region).

**STOP HERE — await review**

## Step 4 — The Synthesizer & Narrator Agents [x]
- **Files to Create:**
  - `server/src/agents/nodes/synthesizer.ts` (Emotional storytelling logic)
  - `server/src/agents/nodes/narrator.ts` (Polishing & Fact-checking logic)
- **Logic:**
  - Synthesizer uses `gpt-4o-mini` to draft the narrative from historical context.
  - Narrator uses `gpt-4o` to verify facts and polish for TTS.
  - Narrator sets `requiresRevision: true` if inaccuracies are found.

**STOP HERE — await review**

## Step 5 — Graph Composition & Routing [x]
- **Files to Create:**
  - `server/src/agents/graph.ts` (Compiles the `StateGraph`)
- **Logic:**
  - Connect Researcher -> Synthesizer -> Narrator.
  - Implement conditional edge from Narrator back to Researcher if `requiresRevision` is true and `iterationCount < 3`.
  - Handle the "END" condition.

**STOP HERE — await review**

## Step 6 — Narrative Service Integration [x]
- **Files to Create:**
  - `server/src/services/narrativeService.ts` (Public service for the backend)
- **Logic:**
  - `generateNarrative(query: string, userId?: string)` function.
  - Invokes the LangGraph runnable.
  - Checks for `handoffPackage` (insufficient retrieval) and returns it if present.
  - Returns the `finalScript` on success.

**STOP HERE — await review**

## Step 7 — Unit & Integration Testing [x]
- **Files to Create:**
  - `server/tests/agents/graph.test.ts` (Integration test for the graph)
  - `server/tests/services/narrativeService.test.ts` (Unit tests for the service)
- **Actions:**
  - Mock `modelRouter` and `vectorStore` for isolated testing.
  - Verify loop-back logic (re-research) works correctly.
  - Verify `HandoffPackage` is returned when retrieval is thin.

**STOP HERE — await review**

## Step 8 — Final Validation & CI [x]
- **Actions:**
  - Run full suite: `npm run lint && npm run typecheck && npm run test`.
  - Verify `model_usage` entries are created after a test run.
  - Manual verification with a few sample queries (e.g., "Polish family in 1890 Chicago").

**STOP HERE — await review**
