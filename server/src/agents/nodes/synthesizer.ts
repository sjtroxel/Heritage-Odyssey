import { AgentState } from '../state.js';
import { ModelRouter } from '../../services/modelRouter.js';
import { MODELS } from '@heritage-odyssey/shared/models';

/**
 * Synthesizer agent node: Combines raw historical facts into a cohesive,
 * emotionally resonant draft narrative.
 */
export async function synthesizerNode(
  state: typeof AgentState.State,
): Promise<Partial<typeof AgentState.State>> {
  try {
    const historicalContextStr = state.historicalContext.join('\n\n');

    const response = await ModelRouter.chat({
      model: MODELS.SYNTHESIZER,
      messages: [
        {
          role: 'system',
          content: `You are a master oral historian. Using the provided facts, narrate a probable story for the user's ancestors. Focus on the 'sensory history'—what they saw, felt, and heard. Avoid clichés; use specific details from the research. The tone should be empathetic and evocative.

Historical Context:
${historicalContextStr}`,
        },
        {
          role: 'user',
          content: `Draft a narrative based on my family history query: "${state.query}"`,
        },
      ],
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    return {
      narrativeDraft: content,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error in Synthesizer node';
    return {
      errors: [...state.errors, errorMessage],
    };
  }
}
