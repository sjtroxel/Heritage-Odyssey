/**
 * Utility to construct API URLs, supporting both relative paths (for development proxy)
 * and absolute URLs (for production environments).
 */
export function apiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (baseUrl) {
    // Ensure no double slashes if path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }
  return path;
}

export type RateLimitScope = 'burst' | 'daily';

export interface QuotaSnapshot {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

export class RateLimitError extends Error {
  rateLimitReset: number;
  scope: RateLimitScope;
  quota?: QuotaSnapshot;
  constructor(resetMs: number, scope: RateLimitScope = 'burst', quota?: QuotaSnapshot) {
    super(scope === 'daily' ? 'Daily narration limit reached.' : 'Rate limit reached.');
    this.name = 'RateLimitError';
    this.rateLimitReset = resetMs;
    this.scope = scope;
    this.quota = quota;
  }
}

/**
 * Enhanced fetch wrapper that handles automatic token refreshing on 401 errors.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {},
  token: string | null,
  refreshFn: () => Promise<string | null>,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const newToken = await refreshFn();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  if (response.status === 429) {
    let scope: RateLimitScope = 'burst';
    let quota: QuotaSnapshot | undefined;
    let resetMs = Date.now() + 10 * 60 * 1000;
    // The daily quota carries its details in the JSON body (readable cross-origin,
    // unlike custom headers). The burst limiter relies on the RateLimit-Reset header.
    try {
      const data = await response.clone().json();
      if (data?.scope === 'daily') {
        scope = 'daily';
        quota = {
          limit: data.limit,
          used: data.used,
          remaining: data.remaining,
          resetsAt: data.resetsAt,
        };
        resetMs =
          typeof data.resetsInSeconds === 'number'
            ? Date.now() + data.resetsInSeconds * 1000
            : Date.parse(data.resetsAt);
      }
    } catch {
      // Body wasn't JSON — fall through to the burst path.
    }
    if (scope === 'burst') {
      const h = response.headers.get('RateLimit-Reset');
      if (h) resetMs = parseInt(h, 10) * 1000;
    }
    throw new RateLimitError(resetMs, scope, quota);
  }

  if (!response.ok) {
    // Attempt to parse error message if available
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Ignore parsing error, use default message
    }
    throw new Error(errorMessage);
  }

  return response;
}
