import { describe, it, expect, beforeEach } from 'vitest';
import {
  DAILY_NARRATION_LIMIT,
  peekQuota,
  consumeQuota,
  __resetQuotaStore,
} from '../src/services/dailyQuota.js';

describe('dailyQuota', () => {
  beforeEach(() => {
    __resetQuotaStore();
  });

  it('starts with the full allowance and zero used', () => {
    const status = peekQuota('1.2.3.4');
    expect(status.limit).toBe(DAILY_NARRATION_LIMIT);
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(DAILY_NARRATION_LIMIT);
  });

  it('peek does not consume', () => {
    peekQuota('1.2.3.4');
    peekQuota('1.2.3.4');
    expect(peekQuota('1.2.3.4').used).toBe(0);
  });

  it('consume decrements remaining and reports allowed until the limit', () => {
    const first = consumeQuota('1.2.3.4');
    expect(first.allowed).toBe(true);
    expect(first.used).toBe(1);
    expect(first.remaining).toBe(DAILY_NARRATION_LIMIT - 1);

    consumeQuota('1.2.3.4');
    const third = consumeQuota('1.2.3.4');
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('blocks once the limit is reached without further incrementing', () => {
    for (let i = 0; i < DAILY_NARRATION_LIMIT; i++) consumeQuota('1.2.3.4');
    const blocked = consumeQuota('1.2.3.4');
    expect(blocked.allowed).toBe(false);
    expect(blocked.used).toBe(DAILY_NARRATION_LIMIT);
    expect(blocked.remaining).toBe(0);
    // A second over-limit attempt still reports the same count, not 4.
    expect(consumeQuota('1.2.3.4').used).toBe(DAILY_NARRATION_LIMIT);
  });

  it('tracks each IP independently', () => {
    consumeQuota('1.1.1.1');
    consumeQuota('1.1.1.1');
    expect(peekQuota('1.1.1.1').used).toBe(2);
    expect(peekQuota('2.2.2.2').used).toBe(0);
  });

  it('rolls over when the UTC day changes', () => {
    const today = new Date('2026-05-31T12:00:00Z');
    consumeQuota('1.2.3.4', today);
    consumeQuota('1.2.3.4', today);
    expect(peekQuota('1.2.3.4', today).used).toBe(2);

    const tomorrow = new Date('2026-06-01T00:30:00Z');
    expect(peekQuota('1.2.3.4', tomorrow).used).toBe(0);
    expect(consumeQuota('1.2.3.4', tomorrow).remaining).toBe(DAILY_NARRATION_LIMIT - 1);
  });

  it('reports a positive seconds-until-reset', () => {
    const status = peekQuota('1.2.3.4', new Date('2026-05-31T23:00:00Z'));
    expect(status.resetsInSeconds).toBe(60 * 60);
    expect(status.resetsAt).toBe('2026-06-01T00:00:00.000Z');
  });
});
