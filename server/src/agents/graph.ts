import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState } from './state.js';
import { researcherNode } from './nodes/researcher.js';
import { synthesizerNode } from './nodes/synthesizer.js';
import { narratorNode } from './nodes/narrator.js';

/**
 * Conditional logic to determine the next step after the Researcher node.
 * Routes to END if a handoffPackage is present (insufficient retrieval).
 */
function routeAfterResearcher(state: typeof AgentState.State) {
  if (state.handoffPackage) {
    return END;
  }
  return 'synthesizer';
}

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

  // 3. Define the starting edge
  .addEdge(START, 'researcher')
  .addEdge('synthesizer', 'narrator')

  // 4. Add conditional edges
  .addConditionalEdges('researcher', routeAfterResearcher, {
    synthesizer: 'synthesizer',
    [END]: END,
  })
  .addConditionalEdges('narrator', routeAfterNarrator, {
    researcher: 'researcher',
    [END]: END,
  });

/**
 * The compiled LangGraph agent swarm.
 */
export const graph = workflow.compile();
