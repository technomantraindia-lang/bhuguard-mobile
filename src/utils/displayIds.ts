/**
 * Phase 6 — Business display IDs.
 *
 * Server-issued display IDs (BHG-KISHAN-* / BHG-FARM-* / BHG-ART-*) are the ONLY source of truth.
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

const FARMER_DISPLAY_PATTERN = /^BHG-KISHAN-(0[1-9]|[1-9]\d*)$/i;
/** Canonical Farm ID: BHG-FARM-01 / BHG-FARM-15 (approved). */
const FARM_DISPLAY_PATTERN = /^BHG-FARM-(0[1-9]|[1-9]\d*)$/i;
/** Zero-padded lookup codes and legacy BHG-FRM-* — never invent; only show if already server-issued. */
const LEGACY_FARM_CODE_PATTERN = /^BHG-FARM-0+\d+$/i;
const LEGACY_FRM_PATTERN = /^BHG-FRM-\d+/i;
const ARTISAN_DISPLAY_PATTERN = /^BHG-ART-(0[1-9]|[1-9]\d*)$/i;

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

/**
 * Normalize zero-padded / legacy farm codes to BHG-FARM-N when digits are present.
 * Does not invent IDs from numeric PKs.
 */
function canonicalizeFarmDisplayCandidate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (FARM_DISPLAY_PATTERN.test(value)) {
    return value;
  }

  const match = value.match(/^(?:BHG-FARM-|BHG-FRM-)0*([1-9]\d*)$/i);
  if (!match) {
    return null;
  }

  const sequence = Number(match[1]);
  if (!Number.isFinite(sequence) || sequence < 1) {
    return null;
  }

  const suffix = sequence < 10 ? `0${sequence}` : String(sequence);
  return `BHG-FARM-${suffix}`;
}

function preferCanonical(
  value: string | null,
  pattern: RegExp,
  legacyFallback?: string | null,
  options?: { farm?: boolean },
): string {
  if (value && pattern.test(value)) {
    return value;
  }

  if (legacyFallback && pattern.test(legacyFallback)) {
    return legacyFallback;
  }

  if (options?.farm) {
    const fromPreferred = canonicalizeFarmDisplayCandidate(value);
    if (fromPreferred && pattern.test(fromPreferred)) {
      return fromPreferred;
    }
    const fromLegacy = canonicalizeFarmDisplayCandidate(legacyFallback ?? null);
    if (fromLegacy && pattern.test(fromLegacy)) {
      return fromLegacy;
    }
  }

  // Never surface raw numeric PKs or unresolved legacy-only tokens as display IDs.
  if (value && (LEGACY_FARM_CODE_PATTERN.test(value) || LEGACY_FRM_PATTERN.test(value))) {
    return DISPLAY_ID_PENDING;
  }

  if (legacyFallback && (LEGACY_FARM_CODE_PATTERN.test(legacyFallback) || LEGACY_FRM_PATTERN.test(legacyFallback))) {
    return DISPLAY_ID_PENDING;
  }

  if (value && !/^\d+$/.test(value)) {
    if (pattern === FARM_DISPLAY_PATTERN && !FARM_DISPLAY_PATTERN.test(value)) {
      return DISPLAY_ID_PENDING;
    }
    if (pattern === FARMER_DISPLAY_PATTERN && !FARMER_DISPLAY_PATTERN.test(value)) {
      return DISPLAY_ID_PENDING;
    }
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
 * Resolves the farm-facing ID. Prefers server `farm_display_id`.
 * Canonical format: BHG-FARM-XX. Never fabricates from numeric farm id alone.
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

  return preferCanonical(preferred, FARM_DISPLAY_PATTERN, legacy, { farm: true });
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
