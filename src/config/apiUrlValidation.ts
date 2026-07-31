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
    'yourdomain.com',
  ];

  return placeholders.some((placeholder) => host === placeholder || host.includes('your-tunnel'));
}

/** Expired or ad-hoc Cloudflare quick tunnels — migrate to live ERP on app launch. */
export function isTryCloudflareTunnelUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';

  return host === 'trycloudflare.com' || host.endsWith('.trycloudflare.com');
}

export function isDemoApiUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';
  return host === 'demo.bhuguard.com';
}

/** Live production ERP host used by the mobile app. */
export function isLiveProductionApiUrl(url: string): boolean {
  const host = getUrlHostname(url)?.toLowerCase() ?? '';
  return host === 'erp.bhuguard.com';
}

/** Hosts whose absolute media URLs should be rewritten onto the live origin. */
export function shouldRewriteMediaHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '10.0.2.2') {
    return true;
  }

  if (host === 'demo.bhuguard.com' || host === 'yourdomain.com') {
    return true;
  }

  if (host === 'trycloudflare.com' || host.endsWith('.trycloudflare.com')) {
    return true;
  }

  if (/^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
    return true;
  }

  return false;
}
