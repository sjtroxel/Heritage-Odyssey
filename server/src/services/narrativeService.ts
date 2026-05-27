import { graph } from '../agents/graph.js';
import { HandoffPackage } from '@heritage-odyssey/shared/types';
import { logger } from './logger.js';
import { exportTrace } from './evalService.js';

/**
 * Public service to generate a historical narrative using the multi-agent swarm.
 *
 * @param query - The user's historical ancestor query.
 * @param userId - Optional user ID for tracking model usage.
 * @returns A promise that resolves to either the final narrative script (string)
 *          or a HandoffPackage if retrieval is insufficient.
 */
export async function generateNarrative(
  query: string,
  userId?: string,
): Promise<string | HandoffPackage> {
  try {
    // Invoke the LangGraph runnable with the initial state
    const result = await graph.invoke(
      {
        query,
        historicalContext: [],
        narrativeDraft: null,
        finalScript: null,
        iterationCount: 0,
        errors: [],
        requiresRevision: false,
        handoffPackage: null,
      },
      {
        configurable: { userId },
      },
    );

    // 1. Check for HandoffPackage (Low-Confidence retrieval)
    if (result.handoffPackage) {
      logger.info('Narrative generation handed off', {
        reason: result.handoffPackage.reason,
        query,
      });
      return result.handoffPackage;
    }

    const answer = result.finalScript ?? result.narrativeDraft;

    // Evaluation Trace Capture (Fire-and-forget)
    if (process.env.EVAL_MODE === 'true' && answer) {
      exportTrace(query, result.historicalContext, answer).catch((err) => {
        logger.warn('Failed to export eval trace in fire-and-forget call', err);
      });
    }

    // 2. Return the final script if available
    if (result.finalScript) {
      return result.finalScript;
    }

    // 3. Fallback to draft if script is missing but errors aren't fatal
    if (result.narrativeDraft) {
      logger.warn('Narrative generation returned draft only', { query });
      return result.narrativeDraft;
    }

    // 4. Handle cases where no output was produced
    const errorMsg =
      result.errors.length > 0
        ? 'Agent errors: ' + result.errors.join('; ')
        : 'No narrative was generated.';

    throw new Error(errorMsg);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate narrative');
    throw error;
  }
}

type AgentName = 'researcher' | 'synthesizer' | 'narrator';
type AgentStepEvent = {
  type: 'agent_step';
  agent: AgentName;
  meta?: {
    contextCount?: number;
    draftLength?: number;
    scriptLength?: number;
  };
};
type CompleteEvent = { type: 'complete'; text: string };
type HandoffEvent = { type: 'handoff'; package: HandoffPackage };
export type NarrativeEvent = AgentStepEvent | CompleteEvent | HandoffEvent;

/**
 * Generates a historical narrative as a stream of agent events.
 */
export async function* generateNarrativeStream(
  query: string,
  userId?: string,
): AsyncGenerator<NarrativeEvent> {
  let finalScript: string | null = null;
  let narrativeDraft: string | null = null;
  let handoffPackage: HandoffPackage | null = null;
  let historicalContext: string[] = [];

  try {
    const stream = await graph.stream(
      {
        query,
        historicalContext: [],
        narrativeDraft: null,
        finalScript: null,
        iterationCount: 0,
        errors: [],
        requiresRevision: false,
        handoffPackage: null,
      },
      {
        streamMode: 'updates',
        configurable: { userId },
      },
    );

    for await (const update of stream) {
      const nodeName = Object.keys(update)[0] as AgentName;
      const state = update[nodeName];

      const meta: Record<string, number> = {};
      if (state?.historicalContext?.length) meta.contextCount = state.historicalContext.length;
      if (state?.narrativeDraft) meta.draftLength = state.narrativeDraft.length;
      if (state?.finalScript) meta.scriptLength = state.finalScript.length;

      yield { type: 'agent_step', agent: nodeName, meta };

      if (state) {
        if (state.finalScript) finalScript = state.finalScript;
        if (state.narrativeDraft) narrativeDraft = state.narrativeDraft;
        if (state.handoffPackage) handoffPackage = state.handoffPackage;
        if (state.historicalContext) historicalContext = state.historicalContext;
      }
    }

    if (handoffPackage) {
      yield { type: 'handoff', package: handoffPackage };
      return;
    }

    const text = finalScript ?? narrativeDraft;

    if (text) {
      // Evaluation Trace Capture (Fire-and-forget)
      if (process.env.EVAL_MODE === 'true') {
        exportTrace(query, historicalContext, text).catch((err) => {
          logger.warn('Failed to export eval trace in fire-and-forget call', err);
        });
      }
      yield { type: 'complete', text };
    } else {
      throw new Error('No narrative was generated.');
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate narrative stream');
    throw error;
  }
}
