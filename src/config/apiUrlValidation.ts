function getUrlHostname(url: string): string | null {
  try {
    return new URL(url.replace(/\/api\/?$/, '') || url).hostname;
  } catch {
    return null;
  }
}

/**
 * Example URLs from help text — not real servers.
 */
export function isPlaceholderApiUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';

  if (!host) {
    return true;
  }

  const placeholders = [
    'something-random.trycloudflare.com',
    'abcd-xyz.trycloudflare.com',
    'your-tunnel.trycloudflare.com',
    'example.com',
    'your-domain.com',
    'api.yourdomain.com',
  ];

  return placeholders.some((placeholder) => host === placeholder || host.includes('your-tunnel'));
}

/** Expired or ad-hoc Cloudflare quick tunnels — migrate to local default on app launch. */
export function isTryCloudflareTunnelUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';

  return host === 'trycloudflare.com' || host.endsWith('.trycloudflare.com');
}

export function isDemoApiUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';
  return host === 'demo.bhuguard.com';
}
