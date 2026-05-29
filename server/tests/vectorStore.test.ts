import { describe, it, expect, vi, beforeEach } from 'vitest';
import { query } from '../src/services/vectorStore.js';
import { createEmbedding } from '../src/services/embedding.js';

const mocks = vi.hoisted(() => {
  const qMock = vi.fn();
  const nsMock = vi.fn(() => ({ query: qMock, upsert: vi.fn() }));
  return { queryMock: qMock, namespaceMock: nsMock };
});

vi.mock('../src/services/pinecone.js', () => ({
  index: {
    query: mocks.queryMock,
    namespace: mocks.namespaceMock,
  },
}));

vi.mock('../src/services/embedding.js', () => ({
  createEmbedding: vi.fn(),
}));

describe('vectorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query Pinecone with correct parameters', async () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    vi.mocked(createEmbedding).mockResolvedValue(mockEmbedding);

    const mockMatches = [
      {
        id: '1',
        score: 0.9,
        metadata: { text: 'historical content' },
      },
    ];
    mocks.queryMock.mockResolvedValue({ matches: mockMatches });

    const results = await query('test query', { topK: 1, year: 1900, region: 'Italy' });

    expect(createEmbedding).toHaveBeenCalledWith('test query');
    expect(mocks.queryMock).toHaveBeenCalledWith({
      vector: mockEmbedding,
      topK: 1,
      filter: { year: 1900, region: 'Italy' },
      includeMetadata: true,
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      id: '1',
      score: 0.9,
      metadata: { text: 'historical content' },
      content: 'historical content',
    });
  });

  it('should use default topK if not provided', async () => {
    vi.mocked(createEmbedding).mockResolvedValue([0.1]);
    mocks.queryMock.mockResolvedValue({ matches: [] });

    await query('test query');

    expect(mocks.queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        topK: 5,
      }),
    );
  });

  it('should handle missing year or region filters correctly', async () => {
    vi.mocked(createEmbedding).mockResolvedValue([0.1]);
    mocks.queryMock.mockResolvedValue({ matches: [] });

    await query('test query', { year: 1920 });
    expect(mocks.queryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: { year: 1920 },
      }),
    );

    await query('test query', { region: 'Ireland' });
    expect(mocks.queryMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: { region: 'Ireland' },
      }),
    );
  });

  it('should not include filter if year and region are missing', async () => {
    vi.mocked(createEmbedding).mockResolvedValue([0.1]);
    mocks.queryMock.mockResolvedValue({ matches: [] });

    await query('test query');

    expect(mocks.queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: undefined,
      }),
    );
  });

  it('should return empty string for content if text metadata is missing', async () => {
    vi.mocked(createEmbedding).mockResolvedValue([0.1]);
    mocks.queryMock.mockResolvedValue({
      matches: [
        {
          id: '2',
          score: 0.8,
          metadata: {},
        },
      ],
    });

    const results = await query('test query');
    expect(results[0].content).toBe('');
  });

  it('should route through namespace when namespace option is provided', async () => {
    const nsMockIndex = { query: vi.fn().mockResolvedValue({ matches: [] }) };
    mocks.namespaceMock.mockReturnValue(nsMockIndex);
    vi.mocked(createEmbedding).mockResolvedValue([0.1]);

    await query('test query', { namespace: 'user-abc' });

    expect(mocks.namespaceMock).toHaveBeenCalledWith('user-abc');
    expect(nsMockIndex.query).toHaveBeenCalled();
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it('should use the default index (no namespace) when namespace is not provided', async () => {
    vi.mocked(createEmbedding).mockResolvedValue([0.1]);
    mocks.queryMock.mockResolvedValue({ matches: [] });

    await query('test query');

    expect(mocks.namespaceMock).not.toHaveBeenCalled();
    expect(mocks.queryMock).toHaveBeenCalled();
  });
});
