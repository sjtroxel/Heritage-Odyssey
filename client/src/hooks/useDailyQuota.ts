import { useState, useCallback, useEffect } from 'react';
import { apiUrl, authFetch, type QuotaSnapshot } from '../lib/api.js';
import { useAuthContext } from '../context/AuthContext.js';

/**
 * Tracks the caller's daily narration allowance (3 per day per IP). The value
 * is fetched on mount; call `refreshQuota()` after any action that may consume
 * a unit, or `setQuota` to apply a snapshot already returned by an error.
 */
export const useDailyQuota = () => {
  const { token, refresh } = useAuthContext();
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);

  const refreshQuota = useCallback(async () => {
    try {
      const res = await authFetch(apiUrl('/api/narrative/quota'), {}, token, refresh);
      if (res.ok) setQuota((await res.json()) as QuotaSnapshot);
    } catch {
      // Leave the last-known value in place on a transient failure.
    }
  }, [token, refresh]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshQuota();
  }, [refreshQuota]);

  return { quota, refreshQuota, setQuota };
};
