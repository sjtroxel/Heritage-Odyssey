export interface User {
  id: string;
  email: string;
  createdAt: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  birthLocation?: string | null;
  currentLocation?: string | null;
  heritageRegions?: string[] | null;
  researchInterests?: string | null;
  profileComplete?: boolean;
  googleId?: string | null;
  authProvider?: string;
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
  lastName?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  originCountry?: string | null;
  destination?: string | null;
  relationship?: string | null;
  notes?: string | null;
  gedcomId?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  arrivalDate?: string | null;
  arrivalPort?: string | null;
  departurePort?: string | null;
  shipName?: string | null;
  occupations?: string[] | null;
  sourceSummary?: string | null;
}

export interface GedcomImportResponse {
  imported: number;
  warnings: string[];
}

export interface SavedNarrative {
  id: string;
  userId: string;
  ancestorProfileId: string | null;
  query: string;
  contentText: string;
  createdAt: string;
  ancestorName?: string | null;
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
  totalRetrieved?: number;
  bestScore?: number;
  suggestion: string;
}

export interface TranscriptionResponse {
  text: string;
}

export interface StreamNarrativeRequest {
  query: string;
  ancestorId?: string;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  birthLocation?: string;
  currentLocation?: string;
  heritageRegions?: string[];
  researchInterests?: string;
}

export interface AncestorCreateRequest {
  name: string;
  birthRegion: string;
  era: string;
  lastName?: string;
  birthYear?: number;
  deathYear?: number;
  originCountry?: string;
  destination?: string;
  relationship?: string;
  notes?: string;
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
