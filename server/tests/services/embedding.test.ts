import { describe, it, expect, vi, beforeEach } from 'vitest';
import { embedAncestorProfile } from '../../src/services/embedding.js';

const mocks = vi.hoisted(() => {
  const createEmbeddingMock = vi.fn();
  const upsertMock = vi.fn().mockResolvedValue(undefined);
  const namespaceMock = vi.fn();
  return { createEmbeddingMock, upsertMock, namespaceMock };
});

vi.mock('openai', () => ({
  default: class MockOpenAI {
    embeddings = { create: mocks.createEmbeddingMock };
  },
}));

vi.mock('../../src/services/pinecone.js', () => ({
  index: {
    namespace: mocks.namespaceMock,
    query: vi.fn(),
  },
}));

vi.mock('../../src/config/env.js', () => ({
  env: {
    OPENAI_API_KEY: 'test-key',
    PINECONE_API_KEY: 'test-key',
    PINECONE_INDEX: 'test-index',
  },
}));

vi.mock('@heritage-odyssey/shared/models', () => ({
  MODELS: { EMBEDDINGS: 'text-embedding-3-small' },
}));

const baseProfile = {
  id: 'profile-uuid',
  userId: 'user-uuid',
  name: 'Heinrich Mueller',
  birthRegion: 'Saxony, Germany',
  era: '1845',
  createdAt: new Date(),
  lastName: 'Mueller',
  birthYear: 1845,
  deathYear: 1921,
  originCountry: null,
  destination: null,
  relationship: null,
  notes: null,
  gedcomId: '@I1@',
  birthDate: '12 MAR 1845',
  birthPlace: 'Saxony, Germany',
  deathDate: '08 NOV 1921',
  deathPlace: 'Chicago, Illinois, USA',
  arrivalDate: '22 APR 1872',
  arrivalPort: 'New York, New York, USA',
  departurePort: 'Bremen, Germany',
  shipName: 'SS Deutschland',
  occupations: ['Blacksmith'],
  sourceSummary: null,
};

describe('embedAncestorProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createEmbeddingMock.mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] });
    mocks.namespaceMock.mockReturnValue({ upsert: mocks.upsertMock });
  });

  it('should call namespace upsert with metadata.text set for each document', async () => {
    await embedAncestorProfile(baseProfile, 'user-uuid');

    expect(mocks.namespaceMock).toHaveBeenCalledWith('user-user-uuid');
    expect(mocks.upsertMock).toHaveBeenCalledOnce();

    const [{ records }] = mocks.upsertMock.mock.calls[0] as [
      { records: Array<{ id: string; values: number[]; metadata: Record<string, unknown> }> },
    ];
    expect(records.length).toBeGreaterThan(0);
    records.forEach((vec) => {
      expect(vec.metadata['text']).toBeTruthy();
      expect(typeof vec.metadata['text']).toBe('string');
    });
  });

  it('should use deterministic vector ids based on profile id', async () => {
    await embedAncestorProfile(baseProfile, 'user-uuid');

    const [{ records }] = mocks.upsertMock.mock.calls[0] as [{ records: Array<{ id: string }> }];
    records.forEach((vec, i) => {
      expect(vec.id).toBe(`anc_profile-uuid_${i}`);
    });
  });

  it('should skip embedding when profile lacks location data', async () => {
    const noLocation = {
      ...baseProfile,
      birthPlace: null,
      deathPlace: null,
      arrivalPort: null,
      departurePort: null,
    };
    await embedAncestorProfile(noLocation, 'user-uuid');

    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });

  it('should skip embedding when profile lacks date data', async () => {
    const noDates = {
      ...baseProfile,
      birthDate: null,
      deathDate: null,
      arrivalDate: null,
      birthYear: null,
    };
    await embedAncestorProfile(noDates, 'user-uuid');

    expect(mocks.upsertMock).not.toHaveBeenCalled();
  });
});
