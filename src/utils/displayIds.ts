/**
 * Phase 6 — Business display IDs.
 *
 * Server-issued display IDs (BHG-KISHAN-* / BHG-ART-*) are the ONLY source of truth.
 * These helpers must NEVER fabricate a display ID locally. When the server has not
 * yet returned a display ID, fall back to the legacy farmer_code/artisan_code, and
 * only when neither is available show a safe placeholder.
 */

type DisplayIdRecord = Record<string, unknown> | null | undefined;

const PLACEHOLDER_VALUES = new Set([
  '',
  '-',
  '—',
  'null',
  'undefined',
  'n/a',
  'none',
  'pending',
  'temp',
  'new',
  'onboarding',
]);

export const DISPLAY_ID_LOADING = 'Loading…';
export const DISPLAY_ID_UNAVAILABLE = '—';

function cleanId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return String(value);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function firstCleanId(record: DisplayIdRecord, keys: string[]): string | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const cleaned = cleanId(record[key]);
    if (cleaned) {
      return cleaned;
    }
  }

  return null;
}

/**
 * Resolves the farmer-facing ID. Prefers the server-issued display field
 * (`farmer_display_id` / `farmer_id_display`), falls back to the legacy
 * `farmer_code`, and otherwise returns a safe loading/unavailable placeholder.
 * Never fabricates a BHG-KISHAN-* value on-device.
 */
export function formatFarmerDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  return (
    firstCleanId(record, ['farmer_display_id', 'farmerDisplayId', 'farmer_id_display', 'farmerIdDisplay'])
    ?? firstCleanId(record, ['farmer_code', 'farmerCode'])
    ?? DISPLAY_ID_UNAVAILABLE
  );
}

/**
 * Resolves the artisan-facing ID. Prefers the server-issued display field
 * (`artisan_display_id`), falls back to the legacy `artisan_code`, and
 * otherwise returns a safe loading/unavailable placeholder. Never fabricates
 * a BHG-ART-* value on-device.
 */
export function formatArtisanDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  return (
    firstCleanId(record, ['artisan_display_id', 'artisanDisplayId'])
    ?? firstCleanId(record, ['artisan_code', 'artisanCode'])
    ?? DISPLAY_ID_UNAVAILABLE
  );
}
