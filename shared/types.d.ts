export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface AncestorProfile {
  id: string;
  userId: string;
  name: string;
  birthRegion: string;
  era: string;
  createdAt: string;
}

export interface SavedNarrative {
  id: string;
  userId: string;
  ancestorProfileId: string;
  contentText: string;
  createdAt: string;
}

export interface ModelUsage {
  id: string;
  userId?: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  endpoint: string;
  createdAt: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}

export interface HandoffPackage {
  reason: 'insufficient_retrieval';
  query: string;
  retrievedCount: number;
  suggestion: string;
}

export interface TranscriptionResponse {
  text: string;
}

export interface StreamNarrativeRequest {
  query: string;
}

export type InteractionMode = 'idle' | 'recording' | 'processing' | 'playing';

export interface NarrativeState {
  id: string;
  query: string;
  text: string | null;
  // audioUrl points to the /api/narrative/stream endpoint; the browser audio element opens it as a streaming connection.
  audioUrl: string | null;
  status: InteractionMode;
}
