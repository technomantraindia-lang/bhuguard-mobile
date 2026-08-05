export const HECTARES_PER_ACRE = 0.4047;
export const SQUARE_METERS_PER_ACRE = 4046.86;

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

  if (normalized.includes('bigha')) {
    return 'acre';
  }

  return null;
}

export function convertFarmArea(
  value: number | null | undefined,
  unit: string | null | undefined,
): FarmAreaTriple | null {
  const amount = parsePositiveNumber(value);
  const canonicalUnit = normalizeUnit(unit) ?? 'acre';

  if (amount === null) {
    return null;
  }

  let acres = amount;

  if (canonicalUnit === 'hectare') {
    acres = amount / HECTARES_PER_ACRE;
  } else if (canonicalUnit === 'square_meter') {
    acres = amount / SQUARE_METERS_PER_ACRE;
  } else if (String(unit ?? '').toLowerCase().includes('bigha')) {
    acres = amount / 1.613;
  }

  const hectares = acres * HECTARES_PER_ACRE;
  const squareMeters = acres * SQUARE_METERS_PER_ACRE;

  return {
    acres,
    hectares,
    squareMeters,
  };
}

export function convertFarmAreaFromRecord(record: Record<string, unknown>): FarmAreaTriple | null {
  const acreValue = parsePositiveNumber(record.area_acres ?? record.land_area_acres ?? record.acre);
  const hectareValue = parsePositiveNumber(record.area_hectares ?? record.land_area_hectares ?? record.hectare);
  const squareMeterValue = parsePositiveNumber(
    record.square_meter ?? record.square_meters ?? record.area_square_meters,
  );
  const landArea = parsePositiveNumber(record.land_area);
  const landUnit = String(record.land_area_unit ?? record.area_unit ?? '');

  if (acreValue !== null) {
    return convertFarmArea(acreValue, 'acre');
  }

  if (hectareValue !== null) {
    return convertFarmArea(hectareValue, 'hectare');
  }

  if (squareMeterValue !== null) {
    return convertFarmArea(squareMeterValue, 'square_meter');
  }

  if (landArea !== null) {
    return convertFarmArea(landArea, landUnit || 'acre');
  }

  return null;
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

export function formatFarmAreaAcre(triple: FarmAreaTriple | null): string {
  if (!triple) {
    return '—';
  }

  const value = formatNumber(triple.acres, 2);
  const label = triple.acres === 1 ? 'Acre' : 'Acres';

  return `${value} ${label}`;
}

export function formatFarmAreaHectare(triple: FarmAreaTriple | null): string {
  if (!triple) {
    return '—';
  }

  const value = formatNumber(triple.hectares, 4);
  const label = triple.hectares === 1 ? 'Hectare' : 'Hectares';

  return `${value} ${label}`;
}

export function formatFarmAreaSquareMeter(triple: FarmAreaTriple | null): string {
  if (!triple) {
    return '—';
  }

  const value = formatNumber(triple.squareMeters, 2);
  const formatted = Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${formatted} Square Meters`;
}

export interface FarmAreaDisplayLabels {
  acres: string;
  hectares: string;
  squareMeters: string;
}

export function formatFarmAreaDisplay(triple: FarmAreaTriple | null): FarmAreaDisplayLabels {
  return {
    acres: formatFarmAreaAcre(triple),
    hectares: formatFarmAreaHectare(triple),
    squareMeters: formatFarmAreaSquareMeter(triple),
  };
}
