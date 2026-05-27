import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNarrative, generateNarrativeStream } from '../../src/services/narrativeService.js';
import { graph } from '../../src/agents/graph.js';

vi.mock('../../src/agents/graph.js', () => ({
  graph: {
    invoke: vi.fn(),
    stream: vi.fn(),
  },
}));

vi.mock('../../src/services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

async function collectEvents<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const events: T[] = [];
  for await (const event of gen) events.push(event);
  return events;
}

describe('narrativeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a HandoffPackage when retrieval is thin', async () => {
    const mockHandoff = {
      reason: 'insufficient_retrieval',
      query: 'test query',
      retrievedCount: 1,
      suggestion: 'Try broadening...',
    };

    vi.mocked(graph.invoke).mockResolvedValue({
      handoffPackage: mockHandoff,
      finalScript: null,
    });

    const result = await generateNarrative('test query');

    expect(result).toEqual(mockHandoff);
    expect(graph.invoke).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' }),
      expect.any(Object),
    );
  });

  it('should return the final script on success', async () => {
    const mockScript = 'Once upon a time...';

    vi.mocked(graph.invoke).mockResolvedValue({
      handoffPackage: null,
      finalScript: mockScript,
    });

    const result = await generateNarrative('test query');

    expect(result).toBe(mockScript);
  });

  it('should return narrativeDraft if finalScript is missing but draft exists', async () => {
    const mockDraft = 'Draft story...';

    vi.mocked(graph.invoke).mockResolvedValue({
      handoffPackage: null,
      finalScript: null,
      narrativeDraft: mockDraft,
    });

    const result = await generateNarrative('test query');

    expect(result).toBe(mockDraft);
  });

  it('should throw an error if neither script nor handoff is returned', async () => {
    vi.mocked(graph.invoke).mockResolvedValue({
      handoffPackage: null,
      finalScript: null,
      narrativeDraft: null,
      errors: ['Some agent error'],
    });

    await expect(generateNarrative('test query')).rejects.toThrow('Agent errors: Some agent error');
  });

  it('should throw an error if graph.invoke fails', async () => {
    vi.mocked(graph.invoke).mockRejectedValue(new Error('Graph failed'));

    await expect(generateNarrative('test query')).rejects.toThrow('Graph failed');
  });

  describe('generateNarrativeStream', () => {
    it('yields an agent_step event for each node with correct meta', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(graph.stream as any).mockResolvedValue(
        (async function* () {
          yield { researcher: { historicalContext: ['context1', 'context2'], iterationCount: 1 } };
          yield { synthesizer: { narrativeDraft: 'A draft.' } };
          yield { narrator: { finalScript: 'Final script.' } };
        })(),
      );

      const events = await collectEvents(generateNarrativeStream('test query'));
      const steps = events.filter((e) => e.type === 'agent_step');

      expect(steps).toHaveLength(3);
      expect(steps[0]).toMatchObject({
        type: 'agent_step',
        agent: 'researcher',
        meta: { contextCount: 2 },
      });
      expect(steps[1]).toMatchObject({
        type: 'agent_step',
        agent: 'synthesizer',
        meta: { draftLength: 8 },
      });
      expect(steps[2]).toMatchObject({
        type: 'agent_step',
        agent: 'narrator',
        meta: { scriptLength: 13 },
      });
    });

    it('yields a complete event with the final script after all nodes fire', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(graph.stream as any).mockResolvedValue(
        (async function* () {
          yield { researcher: { historicalContext: ['ctx'], iterationCount: 1 } };
          yield { synthesizer: { narrativeDraft: 'Draft.' } };
          yield { narrator: { finalScript: 'Final script.' } };
        })(),
      );

      const events = await collectEvents(generateNarrativeStream('test query'));

      expect(events.at(-1)).toEqual({ type: 'complete', text: 'Final script.' });
    });

    it('yields a handoff event when researcher cannot meet retrieval threshold', async () => {
      const mockHandoff = {
        reason: 'insufficient_retrieval',
        query: 'test query',
        retrievedCount: 0,
        suggestion: 'Try a different query.',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(graph.stream as any).mockResolvedValue(
        (async function* () {
          yield { researcher: { handoffPackage: mockHandoff } };
        })(),
      );

      const events = await collectEvents(generateNarrativeStream('test query'));

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({ type: 'agent_step', agent: 'researcher' });
      expect(events[1]).toEqual({ type: 'handoff', package: mockHandoff });
    });

    it('propagates errors thrown by graph.stream', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(graph.stream as any).mockRejectedValue(new Error('Stream failed'));

      await expect(collectEvents(generateNarrativeStream('test query'))).rejects.toThrow(
        'Stream failed',
      );
    });
  });
});
