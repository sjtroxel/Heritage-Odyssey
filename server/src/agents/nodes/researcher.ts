import type { RunnableConfig } from '@langchain/core/runnables';
import { AgentState } from '../state.js';
import { ModelRouter } from '../../services/modelRouter.js';
import { query as vectorStoreQuery } from '../../services/vectorStore.js';
import { MODELS } from '@heritage-odyssey/shared/models';
import { HandoffPackage } from '@heritage-odyssey/shared/types';
import { logger } from '../../services/logger.js';

export async function researcherNode(
  state: typeof AgentState.State,
  config?: RunnableConfig,
): Promise<Partial<typeof AgentState.State>> {
  try {
    const userId = config?.configurable?.userId as string | undefined;

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

    // 2. Query general corpus + personal namespace in parallel
    const [generalRaw, personalRaw] = await Promise.all([
      Promise.all(searchPhrases.map((phrase) => vectorStoreQuery(phrase, { topK: 5 }))),
      userId
        ? Promise.all(
            searchPhrases.map((phrase) =>
              vectorStoreQuery(phrase, { topK: 3, namespace: `user-${userId}` }),
            ),
          )
        : Promise.resolve([]),
    ]);

    // Deduplicate general results by id
    const generalMap = new Map<
      string,
      { id: string; score: number | undefined; content: string }
    >();
    for (const results of generalRaw) {
      for (const result of results) {
        if (!generalMap.has(result.id)) {
          generalMap.set(result.id, { ...result, content: String(result.content) });
        }
      }
    }
    const uniqueGeneral = Array.from(generalMap.values());

    // Deduplicate personal results by id
    const personalMap = new Map<
      string,
      { id: string; score: number | undefined; content: string }
    >();
    for (const results of personalRaw) {
      for (const result of results) {
        if (!personalMap.has(result.id)) {
          personalMap.set(result.id, { ...result, content: String(result.content) });
        }
      }
    }
    const uniquePersonal = Array.from(personalMap.values());

    logger.info('Pinecone scores', {
      general: uniqueGeneral.map((r) => r.score),
      personal: uniquePersonal.map((r) => r.score),
    });

    // 3. Sufficiency: proceed if ≥2 general results score ≥ 0.25 OR any personal records exist
    const qualifyingGeneral = uniqueGeneral.filter((r) => r.score !== undefined && r.score >= 0.25);

    if (qualifyingGeneral.length < 2 && uniquePersonal.length === 0) {
      const totalRetrieved = uniqueGeneral.length;
      const bestScore =
        totalRetrieved > 0 ? Math.max(...uniqueGeneral.map((r) => r.score ?? 0)) : 0;

      const handoff: HandoffPackage = {
        reason: 'insufficient_retrieval',
        query: state.query,
        retrievedCount: qualifyingGeneral.length,
        totalRetrieved,
        bestScore,
        suggestion:
          'The archive has limited records for this query. Try adjusting the era, region, or nationality — or use one of the example queries below.',
      };
      return { handoffPackage: handoff };
    }

    // 4. Merge: personal records prefixed so downstream agents treat them as fact
    const generalContext = qualifyingGeneral.map((r) => r.content);
    const personalContext = uniquePersonal.map((r) => `[PERSONAL RECORD] ${r.content}`);

    return {
      historicalContext: [...generalContext, ...personalContext],
      iterationCount: state.iterationCount + 1,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error in Researcher node';
    return {
      errors: [...state.errors, errorMessage],
    };
  }
}
