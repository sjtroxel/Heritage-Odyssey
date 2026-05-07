import { AgentState } from '../state.js';
import { ModelRouter } from '../../services/modelRouter.js';
import { MODELS } from '@heritage-odyssey/shared/models';

/**
 * Narrator agent node: Polishes the draft for TTS and performs a factual quality gate.
 * If inaccuracies are found, it triggers a revision.
 */
export async function narratorNode(
  state: typeof AgentState.State,
): Promise<Partial<typeof AgentState.State>> {
  try {
    const historicalContextStr = state.historicalContext.join('\n\n');

    const response = await ModelRouter.chat({
      model: MODELS.NARRATOR,
      messages: [
        {
          role: 'system',
          content: `You are the final editor and fact-checker. Your job is twofold:
1. Ensure every major historical claim in the draft is supported by the research data.
2. Optimize the text for spoken word (cadence, tone, clarity).

Historical Context:
${historicalContextStr}

Output your response in ONLY valid JSON format with the following keys:
- "requiresRevision": boolean
- "feedback": string (required only if requiresRevision is true, explaining the errors)
- "finalScript": string (the polished narrative if no revision is needed, otherwise null)
`,
        },
        {
          role: 'user',
          content: `Draft Narrative:
${state.narrativeDraft}`,
        },
      ],
      temperature: 0.1, // Low temperature for factual consistency
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    let parsed: {
      requiresRevision: boolean;
      feedback?: string;
      finalScript?: string | null;
    };

    try {
      // Find JSON block in case model adds prose
      const match = content.match(/\{.*\}/s);
      const jsonStr = match ? match[0] : content;
      parsed = JSON.parse(jsonStr);
    } catch (_parseError) {
      throw new Error(`Failed to parse narrator response as JSON: ${content}`);
    }

    if (parsed.requiresRevision) {
      return {
        requiresRevision: true,
        errors: [...state.errors, `Narrator revision requested: ${parsed.feedback}`],
      };
    }

    return {
      requiresRevision: false,
      finalScript: parsed.finalScript || state.narrativeDraft,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in Narrator node';
    return {
      errors: [...state.errors, errorMessage],
    };
  }
}
