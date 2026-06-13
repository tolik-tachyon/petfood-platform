const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function resolveApiUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/') && apiBaseUrl) {
    return `${apiBaseUrl}${url}`;
  }
  return url;
}
