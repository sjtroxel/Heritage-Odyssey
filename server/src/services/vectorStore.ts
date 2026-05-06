import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../config/env.js';
import { createEmbedding } from './embedding.js';

const pc = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
});

const index = pc.index(env.PINECONE_INDEX);

export interface QueryOptions {
  topK?: number;
  year?: string | number;
  region?: string;
}

/**
 * Queries the Pinecone vector store using a natural language string.
 * Automatically generates an embedding for the query string.
 */
export async function query(text: string, options: QueryOptions = {}) {
  const { topK = 5, year, region } = options;

  const vector = await createEmbedding(text);

  const filter: Record<string, string | number | boolean> = {};
  if (year !== undefined) {
    filter.year = year;
  }
  if (region !== undefined) {
    filter.region = region;
  }

  const queryResponse = await index.query({
    vector,
    topK,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    includeMetadata: true,
  });

  return queryResponse.matches.map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
    content: match.metadata?.text || '', // Assuming 'text' field stores the content
  }));
}
