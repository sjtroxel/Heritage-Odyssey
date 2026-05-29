/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { researcherNode } from '../../../src/agents/nodes/researcher.js';
import { ModelRouter } from '../../../src/services/modelRouter.js';
import { query as vectorStoreQuery } from '../../../src/services/vectorStore.js';

vi.mock('../../../src/services/modelRouter.js', () => ({
  ModelRouter: { chat: vi.fn() },
}));

vi.mock('../../../src/services/vectorStore.js', () => ({
  query: vi.fn(),
}));

vi.mock('../../../src/services/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const baseState = {
  query: 'Irish famine emigrants 1847',
  historicalContext: [],
  narrativeDraft: null,
  finalScript: null,
  iterationCount: 0,
  errors: [],
  requiresRevision: false,
  handoffPackage: null,
  ancestorContext: null,
};

const twoGeneralHits = [
  { id: 'g1', score: 0.9, content: 'General fact 1', metadata: {} },
  { id: 'g2', score: 0.85, content: 'General fact 2', metadata: {} },
];

const onePersonalHit = [{ id: 'p1', score: 0.95, content: 'Ancestor data', metadata: {} }];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ModelRouter.chat).mockResolvedValue({
    content: '["irish famine", "emigrant ships 1847"]',
    usage_metadata: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
  } as any);
});

describe('researcherNode — single-source (no userId)', () => {
  it('returns historicalContext from general corpus when ≥2 results qualify', async () => {
    vi.mocked(vectorStoreQuery).mockResolvedValue(twoGeneralHits);

    const result = await researcherNode(baseState);

    expect(result.historicalContext).toHaveLength(2);
    expect(result.historicalContext).not.toContain(expect.stringContaining('[PERSONAL RECORD]'));
    expect(result.handoffPackage).toBeUndefined();
  });

  it('hands off when general corpus is thin and no userId', async () => {
    vi.mocked(vectorStoreQuery).mockResolvedValue([
      { id: 'g1', score: 0.9, content: 'Only one', metadata: {} },
    ]);

    const result = await researcherNode(baseState);

    expect(result.handoffPackage).toBeDefined();
    expect(result.historicalContext).toBeUndefined();
  });
});

describe('researcherNode — dual-source (with userId)', () => {
  const configWithUser = { configurable: { userId: 'user-abc' } };

  it('queries both the general namespace and user-<id> namespace', async () => {
    vi.mocked(vectorStoreQuery)
      .mockResolvedValueOnce(twoGeneralHits) // phrase 1, general
      .mockResolvedValueOnce(twoGeneralHits) // phrase 2, general
      .mockResolvedValueOnce(onePersonalHit) // phrase 1, personal
      .mockResolvedValueOnce(onePersonalHit); // phrase 2, personal

    await researcherNode(baseState, configWithUser);

    const calls = vi.mocked(vectorStoreQuery).mock.calls;
    const namespaces = calls.map((c) => (c[1] as any)?.namespace);
    expect(namespaces).toContain('user-user-abc');
    expect(namespaces.some((n) => n === undefined)).toBe(true);
  });

  it('prefixes personal results with [PERSONAL RECORD]', async () => {
    vi.mocked(vectorStoreQuery)
      .mockResolvedValueOnce(twoGeneralHits)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(onePersonalHit)
      .mockResolvedValueOnce([]);

    const result = await researcherNode(baseState, configWithUser);

    const personal = result.historicalContext?.filter((c) => c.startsWith('[PERSONAL RECORD]'));
    expect(personal).toHaveLength(1);
    expect(personal![0]).toBe('[PERSONAL RECORD] Ancestor data');
  });

  it('does NOT hand off when general corpus is thin but personal records exist', async () => {
    vi.mocked(vectorStoreQuery)
      .mockResolvedValueOnce([{ id: 'g1', score: 0.1, content: 'Weak hit', metadata: {} }]) // below threshold
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(onePersonalHit)
      .mockResolvedValueOnce([]);

    const result = await researcherNode(baseState, configWithUser);

    expect(result.handoffPackage).toBeUndefined();
    expect(result.historicalContext?.some((c) => c.startsWith('[PERSONAL RECORD]'))).toBe(true);
  });

  it('hands off when both sources are thin', async () => {
    vi.mocked(vectorStoreQuery).mockImplementation(async (_phrase, opts) => {
      if ((opts as any)?.namespace?.startsWith('user-')) return [];
      return [{ id: 'x1', score: 0.1, content: 'Weak', metadata: {} }];
    });

    const result = await researcherNode(baseState, configWithUser);

    expect(result.handoffPackage).toBeDefined();
  });

  it('deduplicates personal results that appear in multiple phrase queries', async () => {
    vi.mocked(vectorStoreQuery)
      .mockResolvedValueOnce(twoGeneralHits)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(onePersonalHit) // same id both times
      .mockResolvedValueOnce(onePersonalHit);

    const result = await researcherNode(baseState, configWithUser);

    const personal = result.historicalContext?.filter((c) => c.startsWith('[PERSONAL RECORD]'));
    expect(personal).toHaveLength(1);
  });
});
