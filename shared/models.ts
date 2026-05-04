export const MODELS = {
  RESEARCHER: 'gpt-4o',
  NARRATOR: 'gpt-4o',
  SYNTHESIZER: 'gpt-4o-mini',
  EMBEDDINGS: 'text-embedding-3-small',
} as const;

export type AIModel = (typeof MODELS)[keyof typeof MODELS];
