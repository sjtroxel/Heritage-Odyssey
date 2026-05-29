/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { synthesizerNode } from '../../../src/agents/nodes/synthesizer.js';
import { ModelRouter } from '../../../src/services/modelRouter.js';

vi.mock('../../../src/services/modelRouter.js', () => ({
  ModelRouter: { chat: vi.fn() },
}));

const baseState = {
  query: 'My ancestor came from County Cork',
  historicalContext: ['General historical context about Ireland.'],
  narrativeDraft: null,
  finalScript: null,
  iterationCount: 1,
  errors: [],
  requiresRevision: false,
  handoffPackage: null,
  ancestorContext: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ModelRouter.chat).mockResolvedValue({
    content: 'Draft narrative text.',
    usage_metadata: { input_tokens: 50, output_tokens: 100, total_tokens: 150 },
  } as any);
});

describe('synthesizerNode', () => {
  it('includes [PERSONAL RECORD] instruction in system prompt when context has personal records', async () => {
    const stateWithPersonal = {
      ...baseState,
      historicalContext: [
        'General historical context.',
        '[PERSONAL RECORD] Bridget Murphy, born 1832 County Cork.',
      ],
    };

    await synthesizerNode(stateWithPersonal);

    const systemContent = vi.mocked(ModelRouter.chat).mock.calls[0][0].messages[0]
      .content as string;
    expect(systemContent).toContain('[PERSONAL RECORD]');
    expect(systemContent).toContain('primary sources');
    expect(systemContent).toContain('Never contradict');
  });

  it('returns narrativeDraft from model response', async () => {
    const result = await synthesizerNode(baseState);
    expect(result.narrativeDraft).toBe('Draft narrative text.');
  });
});
