/**
 * Phase 6 — Business display IDs.
 *
 * Server-issued display IDs (BHG-KISHAN-* / BHG-FRM-* / BHG-ART-*) are the ONLY source of truth.
 * These helpers must NEVER fabricate a display ID locally. When the server has not
 * yet returned a display ID, show "ID Pending".
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
export const DISPLAY_ID_PENDING = 'ID Pending';
export const DISPLAY_ID_UNAVAILABLE = 'ID Pending';

const FARMER_DISPLAY_PATTERN = /^BHG-KISHAN-\d{2,}$/i;
const FARM_DISPLAY_PATTERN = /^BHG-FRM-\d{2,}$/i;
const ARTISAN_DISPLAY_PATTERN = /^BHG-ART-\d{2,}$/i;

function cleanId(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  if (typeof value === 'number') {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed.toUpperCase();
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

function preferCanonical(value: string | null, pattern: RegExp, legacyFallback?: string | null): string {
  if (value && pattern.test(value)) {
    return value;
  }

  if (legacyFallback && pattern.test(legacyFallback)) {
    return legacyFallback;
  }

  if (value && !/^\d+$/.test(value)) {
    // Prefer any non-numeric server code over inventing a display ID.
    return value;
  }

  return DISPLAY_ID_PENDING;
}

/**
 * Resolves the farmer-facing ID. Prefers server `farmer_display_id` / `display_id` / `farmer_id`
 * when they match BHG-KISHAN-*. Never fabricates from numeric PK / array index.
 */
export function formatFarmerDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'farmer_display_id',
    'farmerDisplayId',
    'farmer_id_display',
    'farmerIdDisplay',
    'display_id',
    'displayId',
    'farmer_id',
    'farmerId',
  ]);
  const legacy = firstCleanId(record, ['farmer_code', 'farmerCode']);

  return preferCanonical(preferred, FARMER_DISPLAY_PATTERN, legacy);
}

/**
 * Resolves the farm-facing ID. Prefers server `farm_display_id` / `display_id`.
 * Never fabricates BHG-FRM-* from numeric farm id.
 */
export function formatFarmDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'farm_display_id',
    'farmDisplayId',
    'display_id',
    'displayId',
    'farm_id',
    'farmId',
  ]);
  const legacy = firstCleanId(record, ['farm_code', 'farmCode']);

  return preferCanonical(preferred, FARM_DISPLAY_PATTERN, legacy);
}

/**
 * Resolves the artisan-facing ID. Prefers server `artisan_display_id`.
 * Never fabricates BHG-ART-* on-device.
 */
export function formatArtisanDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'artisan_display_id',
    'artisanDisplayId',
    'display_id',
    'displayId',
    'artisan_id',
    'artisanId',
  ]);
  const legacy = firstCleanId(record, ['artisan_code', 'artisanCode']);

  return preferCanonical(preferred, ARTISAN_DISPLAY_PATTERN, legacy);
}

/**
 * Phase 7 — default Farm Name suggested on Land Registration: `BHG-{FarmerName}-Farm-0N`.
 * Spaces are stripped from the farmer name so the generated name reads like a code.
 * This is a UI-only suggestion the Field Officer can edit before submit — it is not a
 * server-issued ID and must not be confused with farmer/farm/artisan display IDs above.
 */
export function defaultFarmName(farmerName: string, farmIndex: number = 1): string {
  const sanitizedName = (farmerName ?? '').trim().replace(/\s+/g, '');
  const safeName = sanitizedName || 'Farmer';
  const safeIndex = String(Math.max(1, Math.trunc(farmIndex) || 1)).padStart(2, '0');

  return `BHG-${safeName}-Farm-${safeIndex}`;
}
