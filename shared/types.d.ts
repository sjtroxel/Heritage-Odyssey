export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Ancestor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  occupation?: string;
}

export interface MigrationStep {
  id: string;
  ancestorId: string;
  order: number;
  fromLocation: string;
  toLocation: string;
  year?: number;
  reason?: string;
  transportMode?: string;
  historicalContext?: string;
}

export interface Narrative {
  id: string;
  ancestorId: string;
  content: string;
  audioUrl?: string;
  generatedAt: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
}
