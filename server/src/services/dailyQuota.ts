import type { Request } from 'express';

/**
 * Per-IP daily narration quota.
 *
 * The "unit" is one audio synthesis (a POST /api/narrative/tts call): a fresh
 * generation auto-narrates once, and each voice re-choice in My Records is
 * another synthesis. Both consume from the same daily allowance, which is what
 * actually bounds ElevenLabs spend.
 *
 * Storage is in-memory and resets on server restart — adequate for a portfolio
 * deployment. The window is the UTC calendar day.
 */
export const DAILY_NARRATION_LIMIT = 3;

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
  /** ISO timestamp of the next reset (UTC midnight). */
  resetsAt: string;
  /** Whole seconds until reset, for client countdowns / Retry-After. */
  resetsInSeconds: number;
}

interface Entry {
  day: string;
  count: number;
}

const store = new Map<string, Entry>();

const utcDay = (now: Date): string => now.toISOString().slice(0, 10);

const nextUtcMidnight = (now: Date): Date => {
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0);
  return reset;
};

const buildStatus = (count: number, now: Date): QuotaStatus => {
  const reset = nextUtcMidnight(now);
  return {
    limit: DAILY_NARRATION_LIMIT,
    used: count,
    remaining: Math.max(0, DAILY_NARRATION_LIMIT - count),
    resetsAt: reset.toISOString(),
    resetsInSeconds: Math.max(0, Math.ceil((reset.getTime() - now.getTime()) / 1000)),
  };
};

/** Current count for a key, treating a stale (previous-day) entry as zero. */
const currentCount = (key: string, now: Date): number => {
  const entry = store.get(key);
  return entry && entry.day === utcDay(now) ? entry.count : 0;
};

/** Read the quota without consuming any of it. */
export const peekQuota = (key: string, now: Date = new Date()): QuotaStatus =>
  buildStatus(currentCount(key, now), now);

/**
 * Consume one unit. Returns `allowed: false` (and does not increment) when the
 * key is already at the limit, otherwise increments and returns the new status.
 */
export const consumeQuota = (
  key: string,
  now: Date = new Date(),
): QuotaStatus & { allowed: boolean } => {
  const count = currentCount(key, now);
  if (count >= DAILY_NARRATION_LIMIT) {
    return { allowed: false, ...buildStatus(count, now) };
  }
  const next = count + 1;
  store.set(key, { day: utcDay(now), count: next });
  return { allowed: true, ...buildStatus(next, now) };
};

/** Stable per-request key. Relies on `trust proxy` for the real client IP. */
export const quotaKey = (req: Request): string => req.ip ?? 'unknown';

/**
 * Eval/CI requests carrying the bypass token are exempt, mirroring the burst
 * rate limiter's skip so the promptfoo regression suite isn't throttled.
 */
export const isQuotaBypassed = (req: Request): boolean => {
  const token = process.env.EVAL_BYPASS_TOKEN;
  return !!token && req.header('x-eval-bypass') === token;
};

/** Test-only: clear all counters between cases. */
export const __resetQuotaStore = (): void => store.clear();
