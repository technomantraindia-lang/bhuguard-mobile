import { getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { shouldRewriteMediaHost } from '../config/apiUrlValidation';
import { pickString, type ApiRecord } from './apiHelpers';

function apiOrigin(): string {
  return getCachedApiBaseUrl().replace(/\/api\/?$/, '');
}

/**
 * Resolve relative or absolute media/storage paths against the live API origin.
 * Avoids /storage/storage and /api/api duplication.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url || url === '-') {
    return null;
  }

  const trimmed = url.trim();

  if (trimmed.startsWith('file://') || trimmed.startsWith('content://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const origin = apiOrigin();

  if (trimmed.startsWith('/api/')) {
    const base = getCachedApiBaseUrl().replace(/\/$/, '');
    return `${base}${trimmed.slice(4)}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);

      if (shouldRewriteMediaHost(parsed.hostname)) {
        return `${origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return trimmed;
    }

    return trimmed;
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Prevent accidental /storage/storage/... when callers already include storage/
  if (normalizedPath.startsWith('/storage/storage/')) {
    return `${origin}${normalizedPath.replace(/^\/storage\/storage\//, '/storage/')}`;
  }

  return `${origin}${normalizedPath}`;
}

export function extractProfilePhotoUrl(data: ApiRecord): string | null {
  const root = (data.profile ?? data) as ApiRecord;
  const farmerProfile = (root.farmer_profile ?? root) as ApiRecord;

  return resolveMediaUrl(pickString(farmerProfile, 'photo_url'));
}
