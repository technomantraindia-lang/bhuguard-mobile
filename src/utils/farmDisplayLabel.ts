export function sanitizeVillageForFarmLabel(village: string | null | undefined): string {
  const raw = String(village ?? '').trim();
  if (!raw) {
    return 'Unknown';
  }

  const words = raw
    .split(/\s+/)
    .map((word) =>
      word
        .replace(/[^a-zA-Z0-9]/g, '')
        .replace(/^(.)(.*)$/, (_, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase()),
    )
    .filter(Boolean);

  if (words.length === 0) {
    return 'Unknown';
  }

  return words.join('-');
}

export function formatFarmDisplayLabel(
  farm: { village?: string | null; farm_name?: string | null },
  indexZeroBased: number,
): string {
  const villageSource = farm.village?.trim() || farm.farm_name?.trim() || '';
  const villagePart = sanitizeVillageForFarmLabel(villageSource);
  const sequence = String(indexZeroBased + 1).padStart(3, '0');

  return `FRM-${villagePart}-${sequence}`;
}

export function formatProcessDurationHoursMinutes(startIso: string, endIso: string): string {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return '—';
  }

  const totalMinutes = Math.floor((endMs - startMs) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')} hours ${String(minutes).padStart(2, '0')} minutes`;
}

export function groupFarmSearchResultsByFarmer<T extends { farmer_id: number }>(
  records: T[],
): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  records.forEach((record) => {
    const existing = grouped.get(record.farmer_id) ?? [];
    existing.push(record);
    grouped.set(record.farmer_id, existing);
  });

  return grouped;
}

export function labelFarmsForFarmer<T extends { village?: string | null; farm_name?: string | null }>(
  farms: T[],
): Array<T & { displayLabel: string }> {
  return farms.map((farm, index) => ({
    ...farm,
    displayLabel: formatFarmDisplayLabel(farm, index),
  }));
}
