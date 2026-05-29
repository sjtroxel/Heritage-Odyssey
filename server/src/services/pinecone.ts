import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../config/env.js';

const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
export const index = pc.index(env.PINECONE_INDEX);
