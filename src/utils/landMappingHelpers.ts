import type { AreaUnit, BoundaryMetrics } from './boundaryGeometry';
import { ACRES_PER_HECTARE, BIGHA_PER_ACRE, convertArea } from './boundaryGeometry';

export type MappingStatus = 'not_mapped' | 'draft' | 'mapped' | 'pending_review';
export type ComparisonStatus = 'matched' | 'difference_found' | 'needs_review';

export function mappingStatusLabel(status: MappingStatus): string {
  switch (status) {
    case 'draft':
      return 'Mapping Draft';
    case 'mapped':
      return 'Mapped';
    case 'pending_review':
      return 'Pending Review';
    default:
      return 'Not Mapped';
  }
}

export function declaredAreaInAcres(value: number, unit: AreaUnit): number {
  return convertArea(value, unit).acre;
}

export function compareDeclaredAndMapped(
  declaredValue: number,
  declaredUnit: AreaUnit,
  metrics: BoundaryMetrics,
): { differenceAcre: number; status: ComparisonStatus } {
  const declaredAcre = declaredAreaInAcres(declaredValue, declaredUnit);
  const differenceAcre = round(metrics.areaAcre - declaredAcre, 2);

  if (Math.abs(differenceAcre) <= 0.25) {
    return { differenceAcre, status: 'matched' };
  }

  return { differenceAcre, status: 'difference_found' };
}

export function areaValueInUnit(metrics: BoundaryMetrics, unit: AreaUnit): number {
  if (unit === 'hectare') {
    return metrics.areaHectare;
  }

  if (unit === 'bigha') {
    return metrics.areaBigha;
  }

  return metrics.areaAcre;
}

export function formatUnitLabel(unit: AreaUnit): string {
  if (unit === 'hectare') {
    return 'Hectare';
  }

  if (unit === 'bigha') {
    return 'Bigha';
  }

  return 'Acre';
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
