/**
 * Returns true only when an API key looks like a real configured secret,
 * not an empty/placeholder value from .env templates.
 */
export function isRealApiKey(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return false;
  }

  const upper = normalized.toUpperCase();
  const blockedExact = new Set([
    'UNDEFINED',
    'NULL',
    'NIL',
    'NONE',
    'N/A',
    'NA',
    'YOUR_API_KEY',
    'MAPTILER_KEY',
    'MAPTILER_API_KEY',
    'GEOAPIFY_KEY',
    'GEOAPIFY_API_KEY',
    'REPLACE_ME',
    'CHANGEME',
    'TODO',
    'FIXME',
  ]);

  if (blockedExact.has(upper)) {
    return false;
  }

  if (
    upper.includes('YOUR_')
    || upper.includes('PASTE_')
    || upper.includes('PLACEHOLDER')
    || upper.includes('EXAMPLE')
    || upper.includes('REPLACE')
    || upper.startsWith('YOUR')
    || (upper.endsWith('_KEY') && upper.includes('YOUR'))
  ) {
    return false;
  }

  // MapTiler / Geoapify keys are typically longer opaque tokens.
  if (normalized.length < 16) {
    return false;
  }

  return true;
}
