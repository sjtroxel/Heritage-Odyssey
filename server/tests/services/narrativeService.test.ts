import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNarrative } from '../../src/services/narrativeService.js';
import { graph } from '../../src/agents/graph.js';

vi.mock('../../src/agents/graph.js', () => ({
  graph: {
    invoke: vi.fn(),
  },
}));

vi.mock('../../src/services/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

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
});
