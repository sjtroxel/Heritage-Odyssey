import { AgentState } from '../state.js';
import { ModelRouter } from '../../services/modelRouter.js';
import { query as vectorStoreQuery } from '../../services/vectorStore.js';
import { MODELS } from '@heritage-odyssey/shared/models';
import { HandoffPackage } from '@heritage-odyssey/shared/types';

/**
 * Researcher agent node: Generates targeted search phrases and retrieves
 * historical context from the vector store.
 */
export async function researcherNode(
  state: typeof AgentState.State,
): Promise<Partial<typeof AgentState.State>> {
  try {
    // 1. Use ModelRouter.chat() to extract targeted search phrases
    const response = await ModelRouter.chat({
      model: MODELS.RESEARCHER,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional genealogist and historian. Analyze the user query and extract 2-3 targeted search phrases — one broad and one or two specific — that will retrieve the most relevant historical facts from a vector database. Output ONLY a JSON array of strings, e.g. ["phrase one", "phrase two"].',
        },
        {
          role: 'user',
          content: state.query,
        },
      ],
    });

    const content =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Parse the JSON array from the response content string
    let searchPhrases: string[];
    try {
      const match = content.match(/\[.*\]/s);
      const jsonStr = match ? match[0] : content;
      searchPhrases = JSON.parse(jsonStr);
    } catch (_parseError) {
      throw new Error(`Failed to parse search phrases from model response: ${content}`);
    }

    // 2. Query vector store for each phrase and deduplicate results by id
    const allResults = await Promise.all(
      searchPhrases.map((phrase) => vectorStoreQuery(phrase, { topK: 5 })),
    );

    const uniqueResultsMap = new Map<
      string,
      { id: string; score: number | undefined; content: string }
    >();
    for (const results of allResults) {
      for (const result of results) {
        if (!uniqueResultsMap.has(result.id)) {
          uniqueResultsMap.set(result.id, {
            ...result,
            content: String(result.content),
          });
        }
      }
    }

    const uniqueResults = Array.from(uniqueResultsMap.values());

    // 3. Count results with score >= 0.75
    const qualifyingResults = uniqueResults.filter(
      (result) => result.score !== undefined && result.score >= 0.75,
    );
    const count = qualifyingResults.length;

    if (count < 3) {
      // Return a HandoffPackage if fewer than 3 results meet the threshold
      const handoff: HandoffPackage = {
        reason: 'insufficient_retrieval',
        query: state.query,
        retrievedCount: count,
        suggestion:
          "We don't have enough source material for this query. Try broadening the era or region.",
      };
      return { handoffPackage: handoff };
    }

    // 4. Map results to content strings and return state update
    const contents = qualifyingResults.map((result) => result.content);
    return {
      historicalContext: contents,
      iterationCount: state.iterationCount + 1,
    };
  } catch (error: unknown) {
    // 5. Wrap in try/catch and return error message
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error in Researcher node';
    return {
      errors: [...state.errors, errorMessage],
    };
  }
}
