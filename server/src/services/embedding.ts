import OpenAI from 'openai';
import { env } from '../config/env.js';
import { MODELS } from '@heritage-odyssey/shared/models';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Generates a vector embedding for the given text using OpenAI.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODELS.EMBEDDINGS,
    input: text.replace(/\n/g, ' '),
  });

  return response.data[0]!.embedding;
}

/**
 * Generates vector embeddings for a batch of text strings.
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: MODELS.EMBEDDINGS,
    input: texts.map((t) => t.replace(/\n/g, ' ')),
  });

  return response.data.map((d) => d.embedding);
}
