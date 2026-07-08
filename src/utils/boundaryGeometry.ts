import type { LatLng } from './farmSatelliteMap';

export type AreaUnit = 'acre' | 'hectare' | 'bigha';

export const ACRES_PER_HECTARE = 2.47105;
export const BIGHA_PER_ACRE = 1.613;
export const MIN_BOUNDARY_POINTS = 3;
export const MIN_POINT_DISTANCE_METERS = 3;
export const AUTO_CAPTURE_DISTANCE_METERS = 4;
export const AUTO_CAPTURE_INTERVAL_MS = 4000;
export const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 30;
export const BOUNDARY_AREA_TOLERANCE_RATIO = 1.1;
export const BOUNDARY_OUTSIDE_TOLERANCE_METERS = 10;

export type MappingStatus = 'not_started' | 'recording' | 'paused' | 'editing' | 'completed';

export interface BoundaryPoint {
  id: string;
  pointNo: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
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

  if (meters <= 10) {
    return 'Excellent';
  }

  if (meters <= 20) {
    return 'Good';
  }

  if (meters <= 30) {
    return 'Acceptable';
  }

  return 'Poor';
}

export function formatMappingStatus(status: MappingStatus): string {
  switch (status) {
    case 'recording':
      return 'Recording';
    case 'paused':
      return 'Paused';
    case 'editing':
      return 'Editing';
    case 'completed':
      return 'Completed';
    default:
      return 'Not Started';
  }
}

export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    const intersect =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

export function distancePointToSegmentMeters(point: LatLng, start: LatLng, end: LatLng): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat = toRad(point.latitude);
  const x = toRad(point.longitude - start.longitude) * Math.cos((toRad(point.latitude) + toRad(start.latitude)) / 2);
  const y = toRad(point.latitude - start.latitude);
  const dx = toRad(end.longitude - start.longitude) * Math.cos((toRad(end.latitude) + toRad(start.latitude)) / 2);
  const dy = toRad(end.latitude - start.latitude);
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return haversineMeters(point.latitude, point.longitude, start.latitude, start.longitude);
  }

  let t = (x * dx + y * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projLat = start.latitude + t * (end.latitude - start.latitude);
  const projLng = start.longitude + t * (end.longitude - start.longitude);

  return haversineMeters(point.latitude, point.longitude, projLat, projLng);
}

export function distanceOutsidePolygonMeters(point: LatLng, polygon: LatLng[]): number {
  if (polygon.length < 3) {
    return 0;
  }

  if (pointInPolygon(point, polygon)) {
    return 0;
  }

  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    minDistance = Math.min(minDistance, distancePointToSegmentMeters(point, start, end));
  }

  return Number.isFinite(minDistance) ? minDistance : 0;
}

export function isEditedBoundaryOutsideTolerance(
  walkingPoints: BoundaryPoint[],
  editedPoints: BoundaryPoint[],
): boolean {
  if (walkingPoints.length < 3 || editedPoints.length < 3) {
    return false;
  }

  const walking = boundaryPointsToLatLng(walkingPoints);
  const edited = boundaryPointsToLatLng(editedPoints);
  const walkingMetrics = calculateBoundaryMetrics(walking);
  const editedMetrics = calculateBoundaryMetrics(edited);

  if (editedMetrics.areaAcre > walkingMetrics.areaAcre * BOUNDARY_AREA_TOLERANCE_RATIO) {
    return true;
  }

  return edited.some(
    (point) => distanceOutsidePolygonMeters(point, walking) > BOUNDARY_OUTSIDE_TOLERANCE_METERS,
  );
}

export function findNearestEdgeInsertion(
  tap: LatLng,
  points: BoundaryPoint[],
  maxDistanceMeters = 20,
): { insertAfterIndex: number; distance: number } | null {
  if (points.length < 2) {
    return null;
  }

  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const distance = distancePointToSegmentMeters(
      tap,
      { latitude: start.latitude, longitude: start.longitude },
      { latitude: end.latitude, longitude: end.longitude },
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  if (bestIndex < 0 || bestDistance > maxDistanceMeters) {
    return null;
  }

  return { insertAfterIndex: bestIndex, distance: bestDistance };
}

export function serializeBoundaryPointPayload(point: BoundaryPoint) {
  return {
    point_no: point.pointNo,
    sequence: point.pointNo,
    lat: point.latitude,
    lng: point.longitude,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy,
    altitude: point.altitude ?? null,
    timestamp: point.timestamp,
    label: point.label,
    notes: point.notes,
    is_manual: point.manual ?? false,
  };
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
  options?: {
    walkingPoints?: BoundaryPoint[];
    mappingStartedAt?: string | null;
    mappingFinishedAt?: string | null;
    status?: string;
  },
) {
  const walkingPoints = options?.walkingPoints?.length ? options.walkingPoints : points;
  const metrics = calculateBoundaryMetrics(boundaryPointsToLatLng(points));
  const accuracies = points.map((point) => point.accuracy).filter((value) => Number.isFinite(value));
  const averageAccuracy =
    accuracies.length > 0 ? round(accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length, 2) : null;

  return {
    farm_id: farmId,
    unit,
    area_acre: metrics.areaAcre,
    area_hectare: metrics.areaHectare,
    area_bigha: metrics.areaBigha,
    area_sqft: round(metrics.areaAcre * 43560, 2),
    perimeter_meter: metrics.perimeterMeter,
    gps_accuracy: gpsAccuracyLabel.toLowerCase(),
    gps_accuracy_average: averageAccuracy,
    mapping_started_at: options?.mappingStartedAt ?? null,
    mapping_finished_at: options?.mappingFinishedAt ?? null,
    status: options?.status ?? 'completed',
    mapping_status: options?.status ?? 'completed',
    boundary_points: walkingPoints.map(serializeBoundaryPointPayload),
    walking_boundary_points: walkingPoints.map(serializeBoundaryPointPayload),
    edited_boundary_points:
      options?.walkingPoints && options.walkingPoints.length > 0
        ? points.map(serializeBoundaryPointPayload)
        : null,
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

  let hasStampedPhotos = false;

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
      hasStampedPhotos = true;
    }
  });

  if (hasStampedPhotos) {
    formData.append('client_pre_stamped', '1');
  }

  return formData;
}
