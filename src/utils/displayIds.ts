/**
 * Universal Bhuguard display IDs (client-approved, permanent).
 *
 * Farmer:        BHG-KISHAN-01
 * Farm:          BHG-FARM-01
 * Field Officer: BHG-FO-01
 * Artisan:       BHG-ART-01
 * Artisan Pro:   BHG-ART-PRO-01
 * Kiln:          BHG-KILN-01
 *
 * Server-issued IDs are the ONLY source of truth.
 * These helpers must NEVER fabricate a display ID locally.
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
const FARM_DISPLAY_PATTERN = /^BHG-FARM-(0[1-9]|[1-9]\d*)$/i;
const LEGACY_FARM_CODE_PATTERN = /^BHG-FARM-0+\d+$/i;
const LEGACY_FRM_PATTERN = /^BHG-FRM-\d+/i;
const FIELD_OFFICER_DISPLAY_PATTERN = /^BHG-FO-(0[1-9]|[1-9]\d*)$/i;
const LEGACY_FIELD_OFFICER_PATTERN = /^BHG-FO-0+\d+$/i;
const ARTISAN_DISPLAY_PATTERN = /^BHG-ART-(0[1-9]|[1-9]\d*)$/i;
const ARTISAN_PRO_DISPLAY_PATTERN = /^BHG-ART-PRO-(0[1-9]|[1-9]\d*)$/i;
const KILN_DISPLAY_PATTERN = /^BHG-KILN-(0[1-9]|[1-9]\d*)$/i;
const LEGACY_KILN_SHORT_PATTERN = /^BHG-0*([1-9]\d*)$/i;

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

function formatSuffix(sequence: number): string {
  return sequence < 10 ? `0${sequence}` : String(sequence);
}

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

  return `BHG-FARM-${formatSuffix(sequence)}`;
}

function canonicalizeFieldOfficerCandidate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (FIELD_OFFICER_DISPLAY_PATTERN.test(value)) {
    return value;
  }

  const match = value.match(/^BHG-FO-0*([1-9]\d*)$/i);
  if (!match) {
    return null;
  }

  const sequence = Number(match[1]);
  if (!Number.isFinite(sequence) || sequence < 1) {
    return null;
  }

  return `BHG-FO-${formatSuffix(sequence)}`;
}

function canonicalizeKilnCandidate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (KILN_DISPLAY_PATTERN.test(value)) {
    return value;
  }

  const kilnMatch = value.match(/^BHG-KILN-0*([1-9]\d*)$/i);
  if (kilnMatch) {
    const sequence = Number(kilnMatch[1]);
    if (Number.isFinite(sequence) && sequence >= 1) {
      return `BHG-KILN-${formatSuffix(sequence)}`;
    }
  }

  const shortMatch = value.match(LEGACY_KILN_SHORT_PATTERN);
  if (shortMatch) {
    const sequence = Number(shortMatch[1]);
    if (Number.isFinite(sequence) && sequence >= 1) {
      return `BHG-KILN-${formatSuffix(sequence)}`;
    }
  }

  return null;
}

function preferCanonical(
  value: string | null,
  pattern: RegExp,
  legacyFallback?: string | null,
  options?: { farm?: boolean; fieldOfficer?: boolean; kiln?: boolean },
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

  if (options?.fieldOfficer) {
    const fromPreferred = canonicalizeFieldOfficerCandidate(value);
    if (fromPreferred && pattern.test(fromPreferred)) {
      return fromPreferred;
    }
    const fromLegacy = canonicalizeFieldOfficerCandidate(legacyFallback ?? null);
    if (fromLegacy && pattern.test(fromLegacy)) {
      return fromLegacy;
    }
  }

  if (options?.kiln) {
    const fromPreferred = canonicalizeKilnCandidate(value);
    if (fromPreferred && pattern.test(fromPreferred)) {
      return fromPreferred;
    }
    const fromLegacy = canonicalizeKilnCandidate(legacyFallback ?? null);
    if (fromLegacy && pattern.test(fromLegacy)) {
      return fromLegacy;
    }
  }

  if (value && (LEGACY_FARM_CODE_PATTERN.test(value) || LEGACY_FRM_PATTERN.test(value) || LEGACY_FIELD_OFFICER_PATTERN.test(value))) {
    return DISPLAY_ID_PENDING;
  }

  if (
    legacyFallback
    && (LEGACY_FARM_CODE_PATTERN.test(legacyFallback)
      || LEGACY_FRM_PATTERN.test(legacyFallback)
      || LEGACY_FIELD_OFFICER_PATTERN.test(legacyFallback))
  ) {
    return DISPLAY_ID_PENDING;
  }

  return DISPLAY_ID_PENDING;
}

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

export function formatFieldOfficerDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'field_officer_id',
    'fieldOfficerId',
    'field_officer_code',
    'fieldOfficerCode',
    'officer_display_id',
    'officerDisplayId',
    'display_id',
    'displayId',
    'officer_code',
    'officerCode',
  ]);

  return preferCanonical(preferred, FIELD_OFFICER_DISPLAY_PATTERN, null, { fieldOfficer: true });
}

export function formatArtisanDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'artisan_display_id',
    'artisanDisplayId',
    'artisan_id',
    'artisanId',
    'display_id',
    'displayId',
  ]);
  const legacy = firstCleanId(record, ['artisan_code', 'artisanCode']);

  // Never treat ART-PRO as ART.
  if (preferred && ARTISAN_PRO_DISPLAY_PATTERN.test(preferred)) {
    return preferCanonical(legacy, ARTISAN_DISPLAY_PATTERN, null);
  }

  return preferCanonical(preferred, ARTISAN_DISPLAY_PATTERN, legacy);
}

export function formatArtisanProDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'artisan_pro_id',
    'artisanProId',
    'artisan_pro_code',
    'artisanProCode',
    'display_id',
    'displayId',
  ]);

  if (preferred && ARTISAN_PRO_DISPLAY_PATTERN.test(preferred)) {
    return preferred;
  }

  // Fallback: some payloads still put ART-PRO in artisan_display_id.
  const fromDisplay = firstCleanId(record, ['artisan_display_id', 'artisanDisplayId', 'artisan_id', 'artisanId']);
  if (fromDisplay && ARTISAN_PRO_DISPLAY_PATTERN.test(fromDisplay)) {
    return fromDisplay;
  }

  return DISPLAY_ID_PENDING;
}

export function formatKilnDisplayId(record: DisplayIdRecord): string {
  if (record === null || record === undefined) {
    return DISPLAY_ID_LOADING;
  }

  const preferred = firstCleanId(record, [
    'kiln_id',
    'kilnId',
    'display_id',
    'displayId',
    'production_unit_code',
    'productionUnitCode',
  ]);

  return preferCanonical(preferred, KILN_DISPLAY_PATTERN, null, { kiln: true });
}

/**
 * Default Farm Name suggestion on Land Registration: `BHG-{FarmerName}-Farm-0N`.
 * Not a server-issued entity ID.
 */
export function defaultFarmName(farmerName: string, farmIndex: number = 1): string {
  const sanitizedName = (farmerName ?? '').trim().replace(/\s+/g, '');
  const safeName = sanitizedName || 'Farmer';
  const safeIndex = String(Math.max(1, Math.trunc(farmIndex) || 1)).padStart(2, '0');

  return `BHG-${safeName}-Farm-${safeIndex}`;
}
