import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from './state.js';
import { researcherNode } from './nodes/researcher.js';
import { synthesizerNode } from './nodes/synthesizer.js';
import { narratorNode } from './nodes/narrator.js';

/**
 * Conditional logic to determine the next step after the Narrator node.
 * Routes back to Researcher if revision is required and iteration limit not reached.
 */
function routeAfterNarrator(state: typeof AgentState.State) {
  if (state.requiresRevision && state.iterationCount < 3) {
    return 'researcher';
  }
  return END;
}

// 1. Create the StateGraph with the defined AgentState schema
const workflow = new StateGraph(AgentState)
  // 2. Add the agent nodes
  .addNode('researcher', researcherNode)
  .addNode('synthesizer', synthesizerNode)
  .addNode('narrator', narratorNode)

  // 3. Define the linear edges
  .addEdge(START, 'researcher')
  .addEdge('researcher', 'synthesizer')
  .addEdge('synthesizer', 'narrator')

  // 4. Add conditional edge from Narrator
  .addConditionalEdges('narrator', routeAfterNarrator, {
    researcher: 'researcher',
    [END]: END,
  });

/**
 * The compiled LangGraph runnable agent swarm.
 * This is the primary entry point for generating historical narratives.
 */
export const graph = workflow.compile();
