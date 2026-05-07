import { graph } from '../agents/graph.js';
import { HandoffPackage } from '@heritage-odyssey/shared/types';
import { logger } from './logger.js';

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
    logger.error('Failed to generate narrative:', error);
    throw error;
  }
}
