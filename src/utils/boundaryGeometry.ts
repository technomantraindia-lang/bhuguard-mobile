import type { LatLng } from './farmSatelliteMap';

export type AreaUnit = 'acre' | 'hectare' | 'bigha';

export const ACRES_PER_HECTARE = 2.47105;
export const BIGHA_PER_ACRE = 1.613;
export const MIN_BOUNDARY_POINTS = 3;
export const MIN_POINT_DISTANCE_METERS = 3;

export interface BoundaryPoint {
  id: string;
  pointNo: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  label?: string;
  notes?: string;
  manual?: boolean;
  photoUri?: string;
  photoUrl?: string;
  hasPhoto?: boolean;
}

export interface BoundaryMetrics {
  areaAcre: number;
  areaHectare: number;
  areaBigha: number;
  perimeterMeter: number;
}

export function formatGpsAccuracy(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) {
    return 'Unknown';
  }

  if (meters <= 8) {
    return 'Good';
  }

  if (meters <= 20) {
    return 'Moderate';
  }

  return 'Poor';
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function calculateBoundaryMetrics(points: LatLng[]): BoundaryMetrics {
  const areaSqMeters = polygonAreaSquareMeters(points);
  const areaAcre = round(areaSqMeters / 4046.8564224, 2);
  const areaHectare = round(areaAcre / ACRES_PER_HECTARE, 2);
  const areaBigha = round(areaAcre * BIGHA_PER_ACRE, 2);

  let perimeter = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    perimeter += haversineMeters(current.latitude, current.longitude, next.latitude, next.longitude);
  }

  return {
    areaAcre,
    areaHectare,
    areaBigha,
    perimeterMeter: Math.round(perimeter),
  };
}

function polygonAreaSquareMeters(points: LatLng[]): number {
  if (points.length < 3) {
    return 0;
  }

  const earthRadius = 6378137;
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const p1 = points[index];
    const p2 = points[(index + 1) % points.length];
    const lat1 = (p1.latitude * Math.PI) / 180;
    const lat2 = (p2.latitude * Math.PI) / 180;
    const lng1 = (p1.longitude * Math.PI) / 180;
    const lng2 = (p2.longitude * Math.PI) / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs((area * earthRadius * earthRadius) / 2);
}

export function convertArea(value: number, unit: AreaUnit): { acre: number; hectare: number; bigha: number } {
  if (unit === 'hectare') {
    const acre = value * ACRES_PER_HECTARE;
    return { acre: round(acre, 2), hectare: round(value, 2), bigha: round(acre * BIGHA_PER_ACRE, 2) };
  }

  if (unit === 'bigha') {
    const acre = value / BIGHA_PER_ACRE;
    return { acre: round(acre, 2), hectare: round(acre / ACRES_PER_HECTARE, 2), bigha: round(value, 2) };
  }

  return {
    acre: round(value, 2),
    hectare: round(value / ACRES_PER_HECTARE, 2),
    bigha: round(value * BIGHA_PER_ACRE, 2),
  };
}

export function formatAreaByUnit(metrics: BoundaryMetrics, unit: AreaUnit): string {
  if (unit === 'hectare') {
    return `${metrics.areaHectare.toFixed(2)} Hectare`;
  }

  if (unit === 'bigha') {
    return `${metrics.areaBigha.toFixed(2)} Bigha`;
  }

  return `${metrics.areaAcre.toFixed(2)} Acres`;
}

export function boundaryPointsToLatLng(points: BoundaryPoint[]): LatLng[] {
  return points.map((point) => ({ latitude: point.latitude, longitude: point.longitude }));
}

export function hasSelfIntersection(points: LatLng[]): boolean {
  if (points.length < 4) {
    return false;
  }

  const edges = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    return { a: point, b: next };
  });

  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === edges.length - 1)) {
        continue;
      }

      if (segmentsIntersect(edges[i].a, edges[i].b, edges[j].a, edges[j].b)) {
        return true;
      }
    }
  }

  return false;
}

function segmentsIntersect(p1: LatLng, p2: LatLng, p3: LatLng, p4: LatLng): boolean {
  const det = (p2.longitude - p1.longitude) * (p4.latitude - p3.latitude) - (p2.latitude - p1.latitude) * (p4.longitude - p3.longitude);

  if (det === 0) {
    return false;
  }

  const lambda =
    ((p4.latitude - p3.latitude) * (p4.longitude - p1.longitude) + (p3.longitude - p4.longitude) * (p4.latitude - p1.latitude)) / det;
  const gamma =
    ((p1.latitude - p2.latitude) * (p4.latitude - p1.latitude) + (p2.longitude - p1.longitude) * (p4.latitude - p1.latitude)) / det;

  return lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1;
}

export function isCoordinateValid(latitude: string, longitude: string): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function buildBoundaryUploadPayload(
  farmId: number,
  unit: AreaUnit,
  points: BoundaryPoint[],
  gpsAccuracyLabel: string,
) {
  const metrics = calculateBoundaryMetrics(boundaryPointsToLatLng(points));

  return {
    farm_id: farmId,
    unit,
    area_acre: metrics.areaAcre,
    area_hectare: metrics.areaHectare,
    area_bigha: metrics.areaBigha,
    perimeter_meter: metrics.perimeterMeter,
    gps_accuracy: gpsAccuracyLabel.toLowerCase(),
    boundary_points: points.map((point) => ({
      point_no: point.pointNo,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
      timestamp: point.timestamp,
      label: point.label,
      notes: point.notes,
      is_manual: point.manual ?? false,
    })),
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function buildCameraBoundaryUploadFormData(
  farmId: number,
  unit: AreaUnit,
  points: BoundaryPoint[],
  gpsAccuracyLabel: string,
): FormData {
  const metrics = calculateBoundaryMetrics(boundaryPointsToLatLng(points));
  const formData = new FormData();

  formData.append('farm_id', String(farmId));
  formData.append('unit', unit);
  formData.append('area_acre', String(metrics.areaAcre));
  formData.append('area_hectare', String(metrics.areaHectare));
  formData.append('area_bigha', String(metrics.areaBigha));
  formData.append('perimeter_meter', String(metrics.perimeterMeter));
  formData.append('gps_accuracy', gpsAccuracyLabel.toLowerCase());

  points.forEach((point, index) => {
    formData.append(`boundary_points[${index}][point_no]`, String(point.pointNo));
    formData.append(`boundary_points[${index}][latitude]`, String(point.latitude));
    formData.append(`boundary_points[${index}][longitude]`, String(point.longitude));
    formData.append(`boundary_points[${index}][accuracy]`, String(point.accuracy));
    formData.append(`boundary_points[${index}][timestamp]`, point.timestamp);
    formData.append(`boundary_points[${index}][is_manual]`, String(point.manual ?? false));

    if (point.label) {
      formData.append(`boundary_points[${index}][label]`, point.label);
    }

    if (point.notes) {
      formData.append(`boundary_points[${index}][notes]`, point.notes);
    }

    if (point.photoUri) {
      formData.append(`boundary_points[${index}][photo]`, {
        uri: point.photoUri,
        type: 'image/jpeg',
        name: `point_${point.pointNo}.jpg`,
      } as unknown as Blob);
    }
  });

  return formData;
}
