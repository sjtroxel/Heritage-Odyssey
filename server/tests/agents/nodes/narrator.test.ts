/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { narratorNode } from '../../../src/agents/nodes/narrator.js';
import { ModelRouter } from '../../../src/services/modelRouter.js';

vi.mock('../../../src/services/modelRouter.js', () => ({
  ModelRouter: { chat: vi.fn() },
}));

const baseState = {
  query: 'Irish emigrant story',
  historicalContext: ['General historical context.'],
  narrativeDraft: 'Draft text about emigrants.',
  finalScript: null,
  iterationCount: 1,
  errors: [],
  requiresRevision: false,
  handoffPackage: null,
  ancestorContext: null,
};

const successResponse = JSON.stringify({
  requiresRevision: false,
  finalScript: 'Polished script.',
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ModelRouter.chat).mockResolvedValue({
    content: successResponse,
    usage_metadata: { input_tokens: 50, output_tokens: 100, total_tokens: 150 },
  } as any);
});

describe('narratorNode', () => {
  it('includes [PERSONAL RECORD] instruction in system prompt', async () => {
    const stateWithPersonal = {
      ...baseState,
      historicalContext: ['General context.', '[PERSONAL RECORD] Bridget Murphy, born 1832.'],
    };

    await narratorNode(stateWithPersonal);

    const systemContent = vi.mocked(ModelRouter.chat).mock.calls[0][0].messages[0]
      .content as string;
    expect(systemContent).toContain('[PERSONAL RECORD]');
    expect(systemContent).toContain('primary sources');
    expect(systemContent).toContain('Never contradict');
  });

  it('returns finalScript on success', async () => {
    const result = await narratorNode(baseState);
    expect(result.finalScript).toBe('Polished script.');
    expect(result.requiresRevision).toBe(false);
  });

  it('signals requiresRevision when narrator requests it', async () => {
    vi.mocked(ModelRouter.chat).mockResolvedValue({
      content: JSON.stringify({ requiresRevision: true, feedback: 'Date is wrong.' }),
    } as any);

    const result = await narratorNode(baseState);
    expect(result.requiresRevision).toBe(true);
    expect(result.errors?.[0]).toContain('Narrator revision requested');
  });
});
