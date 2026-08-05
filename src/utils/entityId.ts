import {
  formatFarmDisplayId,
  formatFarmerDisplayId,
} from './displayIds';

const PLACEHOLDER_IDS = new Set([
  'onboarding',
  'pending',
  'new',
  'temp',
  'undefined',
  'null',
  'none',
  'n/a',
  '-',
  '—',
]);

/**
 * Rejects placeholders and invalid IDs used by FO farm mapping / onboarding.
 * Accepts positive numeric IDs and non-empty non-placeholder string/UUID IDs.
 */
export function isValidEntityId(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }

    if (PLACEHOLDER_IDS.has(trimmed.toLowerCase())) {
      return false;
    }

    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return asNumber > 0;
    }

    return trimmed.length >= 1;
  }

  return false;
}

export function toPositiveEntityId(value: unknown): number | null {
  if (!isValidEntityId(value)) {
    return null;
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }

  return null;
}

/**
 * NEVER fabricates a display ID locally. Prefer server display ID helpers.
 */
export function formatFarmerDisplayCode(
  farmerId: number | null | undefined,
  farmerCode?: string | null,
  farmerDisplayId?: string | null,
): string {
  return formatFarmerDisplayId({
    farmer_display_id: farmerDisplayId || farmerCode,
    farmer_code: farmerCode,
    id: farmerId ?? undefined,
  });
}

export function formatFarmDisplayCode(
  farmId: number | null | undefined,
  farmCode?: string | null,
  farmDisplayId?: string | null,
): string {
  return formatFarmDisplayId({
    farm_display_id: farmDisplayId || undefined,
    farm_code: farmCode,
    id: farmId ?? undefined,
  });
}
