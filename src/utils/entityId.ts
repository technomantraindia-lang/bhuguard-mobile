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

export function formatFarmerDisplayCode(farmerId: number | null | undefined, farmerCode?: string | null): string {
  const code = farmerCode?.trim();
  if (code && !PLACEHOLDER_IDS.has(code.toLowerCase())) {
    return code;
  }

  if (isValidEntityId(farmerId)) {
    return `BHG-FRM-${String(farmerId).padStart(6, '0')}`;
  }

  return '—';
}

export function formatFarmDisplayCode(farmId: number | null | undefined, farmCode?: string | null): string {
  const code = farmCode?.trim();
  if (code && !PLACEHOLDER_IDS.has(code.toLowerCase())) {
    return code;
  }

  if (isValidEntityId(farmId)) {
    return String(farmId);
  }

  return '—';
}
