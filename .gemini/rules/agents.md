# Agent & LangGraph Rules

- **Model Constants:** All model name strings (e.g., `gpt-4o`, `gpt-4o-mini`, `text-embedding-3-small`) must be defined as constants in `shared/models.ts` and imported. Never hardcode these strings in agent files.
- **Agent State:** Define `AgentState` using `Annotation.Root` from `@langchain/langgraph`. Each field must have its own dedicated `Annotation` entry.
- **Agent Nodes:** Nodes are plain asynchronous TypeScript functions that accept and return the `AgentState` shape. Do not implement nodes as classes.
- **Tool Logic:** LLMs must return structured JSON intent. TypeScript code executes the actual action. LLMs must NOT make HTTP calls directly.
- **Confidence Scores:** Confidence scores must be derived from observable metrics (e.g., source data quality, retrieval scores). Never ask an LLM to rate its own confidence.
- **Infinite Loop Prevention:** Every `StateGraph` loop must include an explicit iteration counter and a hard execution cap (currently 3).
- **Mocking Strategy:** When testing LangGraph, mock individual node functions rather than the compiled graph. This keeps tests performant and allows focused verification of state routing logic.
