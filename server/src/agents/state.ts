import { Annotation } from '@langchain/langgraph';
import { HandoffPackage } from '@heritage-odyssey/shared/types';

/**
 * AgentState defines the schema for the LangGraph orchestration layer.
 * It tracks the progress of the narrative generation from query to final script.
 */
export const AgentState = Annotation.Root({
  // The original user query (e.g., "Tell me about a Polish family in 1890 Chicago")
  query: Annotation<string>,

  // Structured data gathered by the Researcher from the vector store
  historicalContext: Annotation<string[]>,

  // The draft narrative produced by the Synthesizer
  narrativeDraft: Annotation<string | null>,

  // The final polished script produced by the Narrator
  finalScript: Annotation<string | null>,

  // Track research attempts to prevent infinite loops (max 3)
  iterationCount: Annotation<number>,

  // Errors encountered during the agent loop
  errors: Annotation<string[]>,

  // Flag to trigger re-research if the Narrator's fact-check fails
  requiresRevision: Annotation<boolean>,

  // Surfaced when retrieval is too thin to build a historically grounded story
  handoffPackage: Annotation<HandoffPackage | null>,
});
