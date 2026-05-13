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
