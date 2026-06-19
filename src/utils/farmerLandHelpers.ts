const ACRES_PER_HECTARE = 2.4710538147;

/** Gujarat bigha (approx. 0.6198 acres per bigha). */
const ACRES_PER_BIGHA = 0.6198;

export interface FarmerLandTotals {
  acres: number;
  hectares: number;
  bigha: number;
}

function parseArea(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toAcres(value: number, unit: string): number {
  const normalized = unit.trim().toLowerCase();

  if (normalized === 'hectare' || normalized === 'hectares' || normalized === 'ha') {
    return value * ACRES_PER_HECTARE;
  }

  if (normalized === 'bigha' || normalized === 'bighas') {
    return value * ACRES_PER_BIGHA;
  }

  return value;
}

export function sumFarmLandTotals(
  farms: Array<{ land_area?: unknown; area_acres?: unknown; land_area_unit?: unknown; area_unit?: unknown }>,
): FarmerLandTotals | null {
  let totalAcres = 0;

  for (const farm of farms) {
    const unit = String(farm.land_area_unit ?? farm.area_unit ?? 'acres');
    const raw = farm.land_area ?? farm.area_acres;
    const value = parseArea(raw);

    if (value > 0) {
      totalAcres += toAcres(value, unit);
    }
  }

  if (totalAcres <= 0) {
    return null;
  }

  return {
    acres: totalAcres,
    hectares: totalAcres / ACRES_PER_HECTARE,
    bigha: totalAcres / ACRES_PER_BIGHA,
  };
}

export function formatLandAmount(value: number, unit: string): string {
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);

  return `${formatted} ${unit}`;
}
