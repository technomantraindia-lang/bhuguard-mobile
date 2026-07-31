import type { AreaUnit, BoundaryMetrics } from './boundaryGeometry';
import { BIGHA_CONVERSION_CONFIGURED, convertArea } from './boundaryGeometry';

export type MappingStatus = 'not_mapped' | 'draft' | 'mapped' | 'pending_review' | 'pending';
export type ComparisonStatus = 'matched' | 'difference_found' | 'needs_review';

/** Existing project tolerance for declared vs mapped area (acres). */
export const DECLARED_MAPPED_TOLERANCE_ACRE = 0.25;

export function mappingStatusLabel(status: MappingStatus): string {
  switch (status) {
    case 'draft':
      return 'Mapping Draft';
    case 'mapped':
      return 'Mapped';
    case 'pending_review':
      return 'Pending Review';
    case 'pending':
      return 'Pending';
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
): {
  differenceAcre: number;
  differenceInDeclaredUnit: number;
  differencePercent: number;
  status: ComparisonStatus;
  statusLabel: 'Within tolerance' | 'Review required';
} {
  const declaredAcre = declaredAreaInAcres(declaredValue, declaredUnit);
  const mappedInDeclaredUnit = areaValueInUnit(metrics, declaredUnit);
  const differenceInDeclaredUnit = round(mappedInDeclaredUnit - declaredValue, 2);
  const differenceAcre = round(metrics.areaAcre - declaredAcre, 2);
  const differencePercent =
    declaredAcre > 0 ? round((differenceAcre / declaredAcre) * 100, 1) : mappedInDeclaredUnit > 0 ? 100 : 0;

  if (Math.abs(differenceAcre) <= DECLARED_MAPPED_TOLERANCE_ACRE) {
    return {
      differenceAcre,
      differenceInDeclaredUnit,
      differencePercent,
      status: 'matched',
      statusLabel: 'Within tolerance',
    };
  }

  return {
    differenceAcre,
    differenceInDeclaredUnit,
    differencePercent,
    status: 'difference_found',
    statusLabel: 'Review required',
  };
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

export function shouldShowBigha(): boolean {
  return BIGHA_CONVERSION_CONFIGURED;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
