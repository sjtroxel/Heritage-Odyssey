import { createEmbedding } from './embedding.js';
import { index } from './pinecone.js';

export interface QueryOptions {
  topK?: number;
  year?: string | number;
  region?: string;
  namespace?: string;
}

export async function query(text: string, options: QueryOptions = {}) {
  const { topK = 5, year, region, namespace } = options;

  const vector = await createEmbedding(text);

  const filter: Record<string, string | number | boolean> = {};
  if (year !== undefined) filter.year = year;
  if (region !== undefined) filter.region = region;

  const target = namespace ? index.namespace(namespace) : index;

  const queryResponse = await target.query({
    vector,
    topK,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    includeMetadata: true,
  });

  return queryResponse.matches.map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata,
    content: (match.metadata?.['text'] as string) || '',
  }));
}
