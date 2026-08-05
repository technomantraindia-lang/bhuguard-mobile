import { pickString, type ApiRecord } from './apiHelpers';

export interface ProductionUnitOption {
  id: number;
  label: string;
  kilnId: string;
  kilnType?: string;
  village?: string;
  status?: string;
  operatorName: string | null;
}

export function mapProductionUnit(record: ApiRecord): ProductionUnitOption {
  const kilnId = pickString(record, 'kiln_id', 'kilnId');
  const label = pickString(record, 'label');
  const kilnType = pickString(record, 'kiln_type', 'kilnType');
  const village = pickString(record, 'village');
  const status = pickString(record, 'status');

  return {
    id: Number(record.id ?? 0),
    label: label !== '-' ? label : kilnId !== '-' ? kilnId : 'Production Unit',
    kilnId: kilnId !== '-' ? kilnId : '',
    kilnType: kilnType !== '-' ? kilnType : undefined,
    village: village !== '-' ? village : undefined,
    status: status !== '-' ? status : undefined,
    operatorName: pickString(record, 'operator_name', 'operatorName') !== '-'
      ? pickString(record, 'operator_name', 'operatorName')
      : null,
  };
}

export const KILN_ID_MAX_LENGTH = 50;
export const KILN_ID_PATTERN = /^[A-Z0-9-]+$/;
export const KILN_ID_REQUIRED_MESSAGE = 'Enter a Kiln ID or select an existing Pyrolysis Unit.';
export const KILN_ID_FORMAT_MESSAGE =
  'Kiln ID may only contain letters, numbers, and hyphens (max 50 characters).';

export const ARTISAN_KILN_PREFIX = 'BHG-';
export const ARTISAN_KILN_PATTERN = /^BHG-\d{3}$/;
export const ARTISAN_KILN_FORMAT_MESSAGE = 'Kiln ID must match format BHG-001 (BHG- followed by 3 digits).';
export const ASSIGNED_KILN_REQUIRED_MESSAGE = 'No kiln is assigned to your account. Please contact Admin or your Field Officer.';

export function normalizeKilnId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidKilnId(value: string): boolean {
  const normalized = normalizeKilnId(value);
  return (
    normalized.length > 0 &&
    normalized.length <= KILN_ID_MAX_LENGTH &&
    KILN_ID_PATTERN.test(normalized)
  );
}

export function isValidArtisanKilnId(value: string): boolean {
  const normalized = normalizeKilnId(value);
  return ARTISAN_KILN_PATTERN.test(normalized);
}

export function kilnIdValidationError(value: string, mode: 'legacy' | 'artisan' = 'legacy'): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeKilnId(value);
  if (mode === 'artisan') {
    if (!isValidArtisanKilnId(normalized)) {
      return ARTISAN_KILN_FORMAT_MESSAGE;
    }
    return null;
  }

  if (!isValidKilnId(normalized)) {
    return KILN_ID_FORMAT_MESSAGE;
  }

  return null;
}

export function formatCoordinate(value: number | null, direction: 'N' | 'E'): string {
  if (value == null) {
    return '—';
  }

  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function formatProductionDuration(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) {
    return null;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if ([startHour, startMinute, endHour, endMinute].some((part) => Number.isNaN(part))) {
    return null;
  }

  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  const diff = endTotal - startTotal;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function calculateYieldPercent(feedstockQuantity: string, biocharOutput: string): string | null {
  const input = Number(feedstockQuantity);
  const output = Number(biocharOutput);

  if (!Number.isFinite(input) || !Number.isFinite(output) || input <= 0) {
    return null;
  }

  return `${((output / input) * 100).toFixed(1)}%`;
}

export function formatTodayLabel(): string {
  const now = new Date();
  return `Today, ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

export function currentBiocharTimeValue(): string {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function normalizeTimeForApi(value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim();

  if (!trimmed || trimmed === '-') {
    return null;
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    return null;
  }

  if (trimmed.includes('T') || trimmed.includes(' ')) {
    const parsed = new Date(trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T'));

    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    }
  }

  return null;
}

export function pickBiocharTimeValue(item: ApiRecord | null | undefined, ...keys: string[]): string {
  const raw = pickString(item, ...keys);

  return normalizeTimeForApi(raw) ?? '';
}

export function normalizeAltitude(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  if (value < -500 || value > 9000) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export function parseAltitudeInput(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return normalizeAltitude(Number(trimmed));
}
