/**
 * Canonical Farm area helpers for the Farmer module (hectare-first display).
 *
 * 1 hectare = 10,000 square meters
 * 1 acre = 0.40468564224 hectares
 */

export const HECTARES_PER_ACRE = 0.40468564224;
export const SQUARE_METERS_PER_HECTARE = 10_000;
export const SQUARE_METERS_PER_ACRE = HECTARES_PER_ACRE * SQUARE_METERS_PER_HECTARE;

export type CanonicalFarmAreaUnit = 'acre' | 'hectare' | 'square_meter';

export interface FarmAreaTriple {
  acres: number;
  hectares: number;
  squareMeters: number;
}

function parsePositiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeUnit(unit: string | null | undefined): CanonicalFarmAreaUnit | null {
  const normalized = String(unit ?? '').trim().toLowerCase();
  if (normalized.includes('hect')) {
    return 'hectare';
  }
  if (normalized.includes('sq') && (normalized.includes('m') || normalized.includes('meter'))) {
    return 'square_meter';
  }
  if (normalized.includes('acre') || normalized === 'acres') {
    return 'acre';
  }
  return null;
}

export function convertFarmArea(
  value: number | null | undefined,
  unit: string | null | undefined,
): FarmAreaTriple | null {
  const amount = parsePositiveNumber(value);
  if (amount === null) {
    return null;
  }

  const canonicalUnit = normalizeUnit(unit) ?? 'acre';
  let hectares = amount;

  if (canonicalUnit === 'acre') {
    hectares = amount * HECTARES_PER_ACRE;
  } else if (canonicalUnit === 'square_meter') {
    hectares = amount / SQUARE_METERS_PER_HECTARE;
  }

  return {
    hectares,
    acres: hectares / HECTARES_PER_ACRE,
    squareMeters: hectares * SQUARE_METERS_PER_HECTARE,
  };
}

/**
 * Preferred priority:
 * 1. area_hectares
 * 2. mapped polygon square meters
 * 3. acre value
 * 4. land_area + unit
 */
export function resolveFarmAreaHectares(record: Record<string, unknown> | null | undefined): number | null {
  if (!record) {
    return null;
  }

  const hectareValue = parsePositiveNumber(
    record.area_hectares ?? record.land_area_hectares ?? record.hectare ?? record.mapped_area_hectares,
  );
  if (hectareValue !== null) {
    return hectareValue;
  }

  const squareMeterValue = parsePositiveNumber(
    record.polygon_area_sq_m
      ?? record.mapped_area_sq_m
      ?? record.area_sq_m
      ?? record.area_square_meters
      ?? record.square_meters
      ?? record.square_meter
      ?? record.calculated_area_sq_m,
  );
  if (squareMeterValue !== null) {
    return squareMeterValue / SQUARE_METERS_PER_HECTARE;
  }

  const acreValue = parsePositiveNumber(record.area_acres ?? record.land_area_acres ?? record.acre);
  if (acreValue !== null) {
    return acreValue * HECTARES_PER_ACRE;
  }

  const landArea = parsePositiveNumber(record.land_area ?? record.area ?? record.mapped_area ?? record.calculated_area);
  if (landArea !== null) {
    const unit = String(record.land_area_unit ?? record.area_unit ?? '');
    const triple = convertFarmArea(landArea, unit || 'acre');
    return triple?.hectares ?? null;
  }

  return null;
}

export function convertFarmAreaFromRecord(record: Record<string, unknown>): FarmAreaTriple | null {
  const hectares = resolveFarmAreaHectares(record);
  if (hectares === null) {
    return null;
  }

  return {
    hectares,
    acres: hectares / HECTARES_PER_ACRE,
    squareMeters: hectares * SQUARE_METERS_PER_HECTARE,
  };
}

function trimTrailingZeros(value: string): string {
  if (!value.includes('.')) {
    return value;
  }
  return value.replace(/\.?0+$/, '');
}

function formatNumber(value: number, maxDecimals: number): string {
  return trimTrailingZeros(value.toFixed(maxDecimals));
}

export function formatHectares(value: number | null | undefined, maxDecimals = 2): string {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return 'Area not available';
  }

  const formatted = formatNumber(value, maxDecimals);
  const label = Number(formatted) === 1 ? 'Hectare' : 'Hectares';
  return `${formatted} ${label}`;
}

export function formatFarmAreaAcre(triple: FarmAreaTriple | null): string {
  if (!triple) {
    return 'Area not available';
  }
  const formatted = formatNumber(triple.acres, 2);
  const label = Number(formatted) === 1 ? 'Acre' : 'Acres';
  return `${formatted} ${label}`;
}

export function formatFarmAreaHectare(triple: FarmAreaTriple | null, maxDecimals = 4): string {
  if (!triple) {
    return 'Area not available';
  }
  return formatHectares(triple.hectares, maxDecimals);
}

export function formatFarmAreaSquareMeter(triple: FarmAreaTriple | null): string {
  if (!triple) {
    return 'Area not available';
  }
  const formatted = formatNumber(triple.squareMeters, 2);
  return `${formatted} Square Meters`;
}

export interface FarmAreaDisplayLabels {
  acres: string;
  hectares: string;
  squareMeters: string;
}

/** Multi-unit labels for shared/FO use. Farmer UI should use hectares only via formatHectares. */
export function formatFarmAreaDisplay(triple: FarmAreaTriple | null): FarmAreaDisplayLabels {
  return {
    acres: formatFarmAreaAcre(triple),
    hectares: formatFarmAreaHectare(triple, 4),
    squareMeters: formatFarmAreaSquareMeter(triple),
  };
}

/** Farmer-module hectare-only labels (all three keys show hectares for safe drop-in). */
export function formatFarmerHectareOnlyDisplay(triple: FarmAreaTriple | null): FarmAreaDisplayLabels {
  const hectares = formatFarmAreaHectare(triple, 4);
  return {
    acres: hectares,
    hectares,
    squareMeters: hectares,
  };
}

export function sumFarmAreasHectares(
  farms: Array<Record<string, unknown> | { id?: number; areaTriple?: FarmAreaTriple | null }>,
): number {
  const seen = new Set<number>();
  let total = 0;

  for (const farm of farms) {
    const id = Number((farm as { id?: number }).id);
    if (Number.isFinite(id) && id > 0) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
    }

    const fromTriple = (farm as { areaTriple?: FarmAreaTriple | null }).areaTriple?.hectares;
    const hectares =
      fromTriple != null && Number.isFinite(fromTriple) && fromTriple > 0
        ? fromTriple
        : resolveFarmAreaHectares(farm as Record<string, unknown>);

    if (hectares != null && hectares > 0) {
      total += hectares;
    }
  }

  return total;
}
