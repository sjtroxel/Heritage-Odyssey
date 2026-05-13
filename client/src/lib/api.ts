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
