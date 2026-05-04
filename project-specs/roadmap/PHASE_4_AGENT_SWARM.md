# Phase 4 Plan: Agent Swarm (LangGraph)

## 1. Objective
Implement a multi-agent orchestration layer using LangGraph to transform raw user queries about ancestors into emotionally resonant, historically accurate narratives. The swarm will research historical context, synthesize findings, and deliver a final oral-history-style story.

## 2. Dependencies & Setup
- **Core:** `@langchain/langgraph`, `@langchain/openai`.
- **Models:** Defined in `shared/models.ts`.
    - **Primary (Researcher, Narrator):** `gpt-4o`.
    - **Secondary (Synthesizer):** `gpt-4o-mini`.
- **Environment:** `LANGCHAIN_TRACING_V2=true` for debugging complex agent paths.

## 3. State Graph Schema
The graph state will track the evolution of the narrative.

```typescript
// server/src/agents/state.ts
import { Annotation } from "@langchain/langgraph";
import { HandoffPackage } from "../../shared/types.js";

export const AgentState = Annotation.Root({
  // The original user query (e.g., "Tell me about a Polish family in 1890 Chicago")
  query: Annotation<string>,
  
  // Structured data gathered by the Researcher
  historicalContext: Annotation<string[]>,
  
  // The draft narrative produced by the Synthesizer
  narrativeDraft: Annotation<string | null>,
  
  // The final polished script for the Narrator
  finalScript: Annotation<string | null>,
  
  // Track research attempts to prevent infinite loops
  iterationCount: Annotation<number>,
  
  // Errors encountered during the loop
  errors: Annotation<string[]>,
  
  // Flag to trigger re-research if fact-check fails
  requiresRevision: Annotation<boolean>,

  // Surfaced when retrieval is too thin to build a story
  handoffPackage: Annotation<HandoffPackage | null>,
});
```

## 4. Agent Definitions & Tools

### A. The Researcher (The Historian) - GPT-4o
*   **Role:** Performs semantic search against the Pinecone index to gather factual evidence.
*   **Tool:** `historical_search`
    *   **Input:** Search query string + optional era/region filters.
    *   **Implementation:** Calls `vectorStore.query(text, filters)` from Phase 2.
*   **Logic:** Analyzes the user's query for keywords (years, locations, ethnic groups) and executes 2-3 targeted searches.

### B. The Synthesizer (The Storyteller) - GPT-4o-mini
*   **Role:** Combines raw historical facts into a cohesive, emotionally resonant draft.
*   **Logic:** Focuses on the "human element"—sensory details based on the historical facts provided. It ensures the narrative flow is logical and the "probable story" feels lived-in.

### C. The Narrator (The Voice) - GPT-4o
*   **Role:** Polishes the draft into a script optimized for ElevenLabs TTS and performs a factual quality gate.
*   **Logic:** Adjusts cadence and ensures the tone matches the era. Compares the `narrativeDraft` against `historicalContext`. If discrepancies exist, sets `requiresRevision = true`.

## 5. Implementation Workflow (The Graph)

The graph is defined in `server/src/agents/graph.ts`:

1.  **START** -> `researcher_node`
2.  **researcher_node**: Calls `historical_search`. Proceed to `synthesizer_node`.
3.  **synthesizer_node**: Takes `historicalContext` and `query` to produce `narrativeDraft`. Proceed to `narrator_node`.
4.  **narrator_node**: Performs fact-check.
5.  **CONDITIONAL EDGE**:
    *   If `requiresRevision === true` AND `iterationCount < 3` -> `researcher_node` (with specific correction notes).
    *   Else -> **END**.

## 6. Prompt Templates

### Researcher System Prompt
> "You are a professional genealogist and historian. Your goal is to find specific, factual details about the era, location, and social conditions mentioned in the user's query. Use the historical_search tool to gather evidence. Do not hallucinate dates or statistics."

### Synthesizer System Prompt (Emotional Storytelling)
> "You are a master oral historian. Using the provided facts: {historicalContext}, narrate a probable story for the user's ancestors. Focus on the 'sensory history'—what they saw, felt, and heard. Avoid clichés; use specific details from the research. The tone should be empathetic and evocative."

### Narrator System Prompt (Accuracy & Cadence)
> "You are the final editor. Your job is twofold: 
> 1. Ensure every major historical claim in the draft is supported by the research data. 
> 2. Optimize the text for spoken word. 
> If the draft contradicts the research, set requiresRevision to true and explain the error."

## 7. Key Files to Implement
- `server/src/agents/state.ts`: Defines the `AgentState` annotation.
- `server/src/agents/nodes.ts`: Contains the logic for Researcher, Synthesizer, and Narrator nodes.
- `server/src/agents/graph.ts`: Compiles the `StateGraph` and exports the runnable agent.
- `server/src/services/narrativeService.ts`: Exports `generateNarrative(query: string)`, which invokes the LangGraph runnable and returns the `finalScript` or `HandoffPackage`.
- `server/src/services/modelRouter.ts`: Wraps all OpenAI/LangChain SDK calls. After each call, logs a row to the model_usage table (model name, token counts, endpoint). This is the only place in the codebase that imports openai or @langchain/openai directly — all agent nodes call through ModelRouter. Enables cost tracking and a clean swap point if models change.
- `server/tests/agents/graph.test.ts`: A Vitest integration test that compiles the StateGraph and runs one full cycle with all three nodes mocked, verifying two routing scenarios: `requiresRevision` false routes to `END`, and `requiresRevision` true with `iterationCount` below 3 routes back to `researcher_node`.

## 8. Error Handling & Loop Control
- **Iteration Limit:** Max 3 loops. If exceeded, the Narrator must finalize the best possible version.
- **Empty Retrieval:** Researcher broadens search parameters if no results found.

## 9. HandoffPackage: Low-Confidence Surfacing

When the Researcher returns fewer than a configurable minimum number of relevant results (e.g., fewer than 3 vectors above a similarity threshold), the graph must **not** proceed to narrative generation. Instead, it should return a structured `HandoffPackage` to the caller:

```typescript
interface HandoffPackage {
  reason: 'insufficient_retrieval';
  query: string;
  retrievedCount: number;
  suggestion: string; // e.g., "We don't have enough source material on Polish immigration to Chicago in the 1880s. Try broadening the era or region."
}
```

This is a first-class output type of narrativeService.generateNarrative() — not an error. The API route returns it as a structured 200 response so the client can display a helpful message rather than a fabricated narrative. Add handoffPackage: HandoffPackage | null to AgentState.

Both Asteroid Bonanza and Poster Pilot implemented this pattern. It prevents hallucination on thin retrieval and is a portfolio-visible quality signal.

## 10. Verification (Done Criteria)
- [ ] LangGraph successfully executes the full chain from query to script.
- [ ] Researcher correctly passes filters to the Phase 2 `vectorStore.query`.
- [ ] Logs show the Narrator successfully triggering a re-research edge when a fact is wrong.
- [ ] `narrativeService.generateNarrative` is unit tested with mock agent outputs.
- [ ] A sample query produces a script >300 words with specific historical references.
- [ ] The StateGraph compiles without error in the test environment.
- [ ] The conditional routing logic (re-research edge and iteration limit) is verified by automated test.
- [ ] When retrieval returns fewer than 3 results above threshold, generateNarrative returns a HandoffPackage instead of a narrative — verified by unit test with a mocked empty vectorStore response.
- [ ] Every model call logs a row to model_usage — verified by checking the table after a test narrative run.
