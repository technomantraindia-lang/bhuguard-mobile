import { getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { pickString, type ApiRecord } from './apiHelpers';

function apiOrigin(): string {
  return getCachedApiBaseUrl().replace(/\/api\/?$/, '');
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url || url === '-') {
    return null;
  }

  const trimmed = url.trim();

  if (trimmed.startsWith('file://')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/')) {
    const base = getCachedApiBaseUrl().replace(/\/$/, '');

    return `${base}${trimmed.slice(4)}`;
  }

  const origin = apiOrigin();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);

      if (LOCAL_HOSTS.has(parsed.hostname)) {
        return `${origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  }

  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export function extractProfilePhotoUrl(data: ApiRecord): string | null {
  const root = (data.profile ?? data) as ApiRecord;
  const farmerProfile = (root.farmer_profile ?? root) as ApiRecord;

  return resolveMediaUrl(pickString(farmerProfile, 'photo_url'));
}
