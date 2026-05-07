/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { graph } from '../../src/agents/graph.js';
import { ModelRouter } from '../../src/services/modelRouter.js';
import { query as vectorStoreQuery } from '../../src/services/vectorStore.js';

vi.mock('../../src/services/modelRouter.js', () => ({
  ModelRouter: {
    chat: vi.fn(),
  },
}));

vi.mock('../../src/services/vectorStore.js', () => ({
  query: vi.fn(),
}));

vi.mock('../../src/services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Agent Swarm Graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete a full cycle from research to final script', async () => {
    // 1. Researcher
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({
      content: '["phrase 1", "phrase 2"]',
      usage_metadata: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
    } as any);
    vi.mocked(vectorStoreQuery).mockResolvedValue([
      { id: '1', score: 0.9, content: 'Fact 1', metadata: {} },
      { id: '2', score: 0.85, content: 'Fact 2', metadata: {} },
      { id: '3', score: 0.8, content: 'Fact 3', metadata: {} },
    ]);

    // 2. Synthesizer
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({
      content: 'Draft content',
      usage_metadata: { input_tokens: 50, output_tokens: 100, total_tokens: 150 },
    } as any);

    // 3. Narrator
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({
      content: JSON.stringify({
        requiresRevision: false,
        finalScript: 'Final polished script',
      }),
      usage_metadata: { input_tokens: 150, output_tokens: 120, total_tokens: 270 },
    } as any);

    const result = await graph.invoke({
      query: 'Standard test query',
      historicalContext: [],
      narrativeDraft: null,
      finalScript: null,
      iterationCount: 0,
      errors: [],
      requiresRevision: false,
      handoffPackage: null,
    });

    expect(result.finalScript).toBe('Final polished script');
    expect(result.historicalContext).toHaveLength(3);
    expect(result.iterationCount).toBe(1);
    expect(result.requiresRevision).toBe(false);
  });

  it('should trigger a revision loop if the narrator detects inaccuracies', async () => {
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({ content: '["search 1"]' } as any);
    vi.mocked(vectorStoreQuery).mockResolvedValue([
      { id: '1', score: 0.9, content: 'Fact 1', metadata: {} },
      { id: '2', score: 0.9, content: 'Fact 2', metadata: {} },
      { id: '3', score: 0.9, content: 'Fact 3', metadata: {} },
    ]);
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({ content: 'Draft 1' } as any);
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({
      content: JSON.stringify({
        requiresRevision: true,
        feedback: 'Fact 1 is wrong',
      }),
    } as any);

    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({ content: '["search 2"]' } as any);
    vi.mocked(vectorStoreQuery).mockResolvedValue([
      { id: '4', score: 0.9, content: 'Fact 4', metadata: {} },
      { id: '5', score: 0.9, content: 'Fact 5', metadata: {} },
      { id: '6', score: 0.9, content: 'Fact 6', metadata: {} },
    ]);
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({ content: 'Draft 2' } as any);
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({
      content: JSON.stringify({
        requiresRevision: false,
        finalScript: 'Final Script 2',
      }),
    } as any);

    const result = await graph.invoke({
      query: 'Revision test query',
      historicalContext: [],
      narrativeDraft: null,
      finalScript: null,
      iterationCount: 0,
      errors: [],
      requiresRevision: false,
      handoffPackage: null,
    });

    expect(result.iterationCount).toBe(2);
    expect(result.finalScript).toBe('Final Script 2');
    expect(result.requiresRevision).toBe(false);
    expect(result.errors.some((e) => e.includes('Narrator revision requested'))).toBe(true);
  });

  it('should set handoffPackage and STOP if retrieval is insufficient', async () => {
    vi.mocked(ModelRouter.chat).mockResolvedValueOnce({
      content: '["thin query"]',
    } as any);

    vi.mocked(vectorStoreQuery).mockResolvedValue([
      { id: '1', score: 0.9, content: 'Single fact', metadata: {} },
    ]);

    const result = await graph.invoke({
      query: 'Thin data query',
      historicalContext: [],
      narrativeDraft: null,
      finalScript: null,
      iterationCount: 0,
      errors: [],
      requiresRevision: false,
      handoffPackage: null,
    });

    expect(result.handoffPackage).not.toBeNull();
    expect(result.handoffPackage?.retrievedCount).toBe(1);
    expect(result.narrativeDraft).toBeNull();
    expect(result.finalScript).toBeNull();

    expect(ModelRouter.chat).toHaveBeenCalledTimes(1);
  });
});
