import type { OnboardingDraft } from '../context/OnboardingContext';
import {
  boundaryPointsToLatLng,
  calculateBoundaryMetrics,
  formatAreaByUnit,
  formatGpsAccuracy,
  type BoundaryPoint,
} from './boundaryGeometry';
import { boundingBoxDimensions } from './boundaryBox';
import { compareDeclaredAndMapped } from './landMappingHelpers';

export function buildOnboardingBoundaryPayload(draft: OnboardingDraft) {
  const metrics = calculateBoundaryMetrics(boundaryPointsToLatLng(draft.boundary_points));
  const dimensions = boundingBoxDimensions(boundaryPointsToLatLng(draft.boundary_points));
  const declaredValue = Number(draft.land_area);
  const comparison = Number.isFinite(declaredValue)
    ? compareDeclaredAndMapped(declaredValue, draft.boundary_unit, metrics)
    : { differenceAcre: 0, status: 'needs_review' as const };

  const latitudes = draft.boundary_points.map((point) => point.latitude);
  const longitudes = draft.boundary_points.map((point) => point.longitude);
  const centerLatitude = latitudes.length ? latitudes.reduce((a, b) => a + b, 0) / latitudes.length : null;
  const centerLongitude = longitudes.length ? longitudes.reduce((a, b) => a + b, 0) / longitudes.length : null;

  return {
    declared_area: draft.land_area,
    declared_unit: draft.land_area_unit,
    unit: draft.boundary_unit,
    actual_area_acre: metrics.areaAcre,
    actual_area_hectare: metrics.areaHectare,
    actual_area_bigha: metrics.areaBigha,
    perimeter_meter: metrics.perimeterMeter,
    estimated_length_meter: dimensions.lengthMeter,
    estimated_width_meter: dimensions.widthMeter,
    difference_area_acre: comparison.differenceAcre,
    mapping_status: draft.boundary_mapping_status === 'pending_review' ? 'mapped' : draft.boundary_mapping_status,
    verification_status: draft.boundary_verification_status,
    center_latitude: centerLatitude,
    center_longitude: centerLongitude,
    gps_accuracy: formatGpsAccuracy(draft.boundary_points[draft.boundary_points.length - 1]?.accuracy ?? null).toLowerCase(),
    capture_method: draft.boundary_capture_method,
    boundary_points: serializeBoundaryPoints(draft.boundary_points),
  };
}

export function mappedAreaLabelForDraft(draft: OnboardingDraft): string | null {
  if (draft.boundary_points.length < 3) {
    return null;
  }

  const metrics = calculateBoundaryMetrics(boundaryPointsToLatLng(draft.boundary_points));
  return formatAreaByUnit(metrics, draft.boundary_unit);
}

function serializeBoundaryPoints(points: BoundaryPoint[]) {
  return points.map((point) => ({
    point_no: point.pointNo,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy,
    captured_at: point.timestamp,
    timestamp: point.timestamp,
    label: point.label,
    notes: point.notes,
    is_manual: point.manual ?? false,
  }));
}
