import * as turf from '@turf/turf';

import type { LatLng } from './farmSatelliteMap';
import {
  BIGHA_PER_ACRE,
  calculateBoundaryMetrics,
  findNearestEdgeInsertion,
  type BoundaryMetrics,
  type BoundaryPoint,
  MIN_BOUNDARY_POINTS,
} from './boundaryGeometry';
import { formatGpsAccuracy } from './formatGpsAccuracy';

export const MANUAL_BOUNDARY_BORDER_COLOR = '#0E7A45';
export const MANUAL_BOUNDARY_FILL_COLOR = 'rgba(14,122,69,0.28)';
export const INVALID_BOUNDARY_BORDER_COLOR = '#DC2626';
export const INVALID_BOUNDARY_FILL_COLOR = 'rgba(220,38,38,0.28)';

export const SQUARE_METERS_PER_ACRE = 4046.8564224;
export const SQUARE_METERS_PER_HECTARE = 10000;
export const SQUARE_FEET_PER_SQUARE_METER = 10.7639104167;

/** Reject accidental taps that would create absurd farm polygons (~500 ha). */
export const MAX_REASONABLE_AREA_SQUARE_METERS = 5_000_000;
export const MIN_VERTEX_SEPARATION_METERS = 1.5;
export const MIN_TAP_DEBOUNCE_MS = 350;

export type ManualDrawingPhase = 'idle' | 'drawing' | 'completed' | 'editing';

export function formatManualGpsAccuracy(meters: number | null | undefined): string {
  const formatted = formatGpsAccuracy(meters);
  if (formatted.status === 'unavailable') {
    return 'Unknown';
  }
  return formatted.valueText.split(' · ')[1] ?? formatted.valueText;
}

export function formatManualGpsAccuracyLabel(meters: number | null | undefined): string {
  return formatGpsAccuracy(meters).label;
}

export function isFiniteLatLng(coordinate: LatLng): boolean {
  return (
    Number.isFinite(coordinate.latitude)
    && Number.isFinite(coordinate.longitude)
    && coordinate.latitude >= -90
    && coordinate.latitude <= 90
    && coordinate.longitude >= -180
    && coordinate.longitude <= 180
  );
}

export function distanceMetersBetween(a: LatLng, b: LatLng): number {
  return turf.distance(
    turf.point([a.longitude, a.latitude]),
    turf.point([b.longitude, b.latitude]),
    { units: 'meters' },
  );
}

export function pointsTooClose(a: LatLng, b: LatLng, minMeters = MIN_VERTEX_SEPARATION_METERS): boolean {
  return distanceMetersBetween(a, b) < minMeters;
}

function toClosedRing(points: LatLng[]): Array<[number, number]> {
  const ring = points.map((point): [number, number] => [point.longitude, point.latitude]);
  if (ring.length === 0) {
    return ring;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]]);
  }

  return ring;
}

export function buildPolygonFeature(points: LatLng[]): GeoJSON.Feature<GeoJSON.Polygon> | null {
  if (points.length < MIN_BOUNDARY_POINTS || points.some((point) => !isFiniteLatLng(point))) {
    return null;
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [toClosedRing(points)],
    },
  };
}

export function buildLineFeature(points: LatLng[]): GeoJSON.Feature<GeoJSON.LineString> | null {
  if (points.length < 2 || points.some((point) => !isFiniteLatLng(point))) {
    return null;
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: points.map((point) => [point.longitude, point.latitude]),
    },
  };
}

export function buildVerticesFeatureCollection(
  points: BoundaryPoint[],
  selectedPointId?: string | null,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points
      .filter((point) => isFiniteLatLng(point))
      .map((point, index) => ({
        type: 'Feature' as const,
        id: point.id,
        properties: {
          pointId: point.id,
          pointNo: point.pointNo,
          isFirst: index === 0,
          isSelected: selectedPointId != null && point.id === selectedPointId,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [point.longitude, point.latitude] as [number, number],
        },
      })),
  };
}

export function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

export function polygonHasSelfIntersection(points: LatLng[]): boolean {
  const feature = buildPolygonFeature(points);
  if (!feature) {
    return false;
  }

  try {
    const kinks = turf.kinks(feature);
    return kinks.features.length > 0;
  } catch {
    return true;
  }
}

export function validateManualPolygon(points: BoundaryPoint[]): {
  valid: boolean;
  message: string | null;
  metrics: BoundaryMetrics | null;
} {
  if (points.length < MIN_BOUNDARY_POINTS) {
    return {
      valid: false,
      message: 'Please add at least 3 boundary points to submit.',
      metrics: null,
    };
  }

  for (const point of points) {
    if (!isFiniteLatLng(point)) {
      return {
        valid: false,
        message: 'Boundary coordinates are invalid.',
        metrics: null,
      };
    }
  }

  for (let i = 1; i < points.length; i += 1) {
    if (pointsTooClose(points[i - 1], points[i])) {
      return {
        valid: false,
        message: 'Two boundary points are too close.',
        metrics: null,
      };
    }
  }

  const latLng = points.map((point) => ({ latitude: point.latitude, longitude: point.longitude }));
  const feature = buildPolygonFeature(latLng);

  if (!feature) {
    return {
      valid: false,
      message: 'Boundary coordinates are invalid.',
      metrics: null,
    };
  }

  if (polygonHasSelfIntersection(latLng)) {
    return {
      valid: false,
      message: 'The boundary crosses itself. Please edit the points.',
      metrics: null,
    };
  }

  let areaSquareMeters = 0;
  try {
    areaSquareMeters = Math.abs(turf.area(feature));
  } catch {
    return {
      valid: false,
      message: 'The selected area could not be calculated. Please verify the points.',
      metrics: null,
    };
  }

  if (!(areaSquareMeters > 0)) {
    return {
      valid: false,
      message: 'The selected area appears too small. Please verify the points.',
      metrics: null,
    };
  }

  if (areaSquareMeters > MAX_REASONABLE_AREA_SQUARE_METERS) {
    return {
      valid: false,
      message: 'The selected area appears too large. Please verify the points.',
      metrics: null,
    };
  }

  const metrics = calculateTurfBoundaryMetrics(latLng) ?? calculateBoundaryMetrics(latLng);

  return {
    valid: true,
    message: null,
    metrics,
  };
}

/** Turf.js geodesic area + perimeter metrics for manually drawn polygons. */
export function calculateTurfBoundaryMetrics(points: LatLng[]): BoundaryMetrics | null {
  const feature = buildPolygonFeature(points);
  if (!feature) {
    return null;
  }

  let areaSquareMeters = 0;
  let perimeterMeter = 0;

  try {
    areaSquareMeters = Math.abs(turf.area(feature));
    const line = turf.polygonToLine(feature);
    perimeterMeter = turf.length(line, { units: 'meters' });
  } catch {
    return null;
  }

  if (!(areaSquareMeters > 0) || !Number.isFinite(perimeterMeter)) {
    return null;
  }

  const areaAcre = areaSquareMeters / SQUARE_METERS_PER_ACRE;
  const areaHectare = areaSquareMeters / SQUARE_METERS_PER_HECTARE;

  return {
    areaSquareMeters: Number(areaSquareMeters.toFixed(2)),
    areaSquareFeet: Number((areaSquareMeters * SQUARE_FEET_PER_SQUARE_METER).toFixed(0)),
    areaAcre: Number(areaAcre.toFixed(4)),
    areaHectare: Number(areaHectare.toFixed(4)),
    areaBigha: Number((areaAcre * BIGHA_PER_ACRE).toFixed(4)),
    perimeterMeter: Math.round(perimeterMeter),
  };
}

export function formatManualAreaDisplay(metrics: BoundaryMetrics): string {
  return `Area: ${metrics.areaSquareMeters.toFixed(2)} m² | ${metrics.areaSquareFeet.toFixed(2)} ft² | ${metrics.areaAcre.toFixed(4)} acres | ${metrics.areaHectare.toFixed(4)} ha`;
}

export function formatManualAreaBlocks(metrics: BoundaryMetrics): string[] {
  return [
    `Square meters: ${metrics.areaSquareMeters.toFixed(2)}`,
    `Square feet: ${metrics.areaSquareFeet.toFixed(2)}`,
    `Acres: ${metrics.areaAcre.toFixed(4)}`,
    `Hectares: ${metrics.areaHectare.toFixed(4)}`,
  ];
}

export function createManualBoundaryPoint(
  coordinate: LatLng,
  accuracy: number,
  pointNo: number,
  altitude?: number | null,
): BoundaryPoint {
  return {
    id: `manual-${Date.now()}-${pointNo}`,
    pointNo,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    accuracy,
    altitude: altitude ?? null,
    timestamp: new Date().toISOString(),
    manual: true,
  };
}

export function tryInsertVertexOnEdge(
  tap: LatLng,
  points: BoundaryPoint[],
  accuracy: number,
  maxDistanceMeters = 25,
): BoundaryPoint[] | null {
  const insertion = findNearestEdgeInsertion(tap, points, maxDistanceMeters);

  if (!insertion) {
    return null;
  }

  const nextPoint = createManualBoundaryPoint(tap, accuracy, insertion.insertAfterIndex + 2);
  const updated = [...points];
  updated.splice(insertion.insertAfterIndex + 1, 0, nextPoint);

  return updated.map((point, index) => ({
    ...point,
    pointNo: index + 1,
  }));
}

export function polygonCentroid(points: LatLng[]): LatLng | null {
  const feature = buildPolygonFeature(points);
  if (!feature) {
    return null;
  }

  try {
    const center = turf.centroid(feature);
    const [longitude, latitude] = center.geometry.coordinates;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return { latitude, longitude };
  } catch {
    return null;
  }
}

export function polygonBounds(points: LatLng[]): [number, number, number, number] | null {
  const feature = buildPolygonFeature(points);
  if (!feature) {
    return null;
  }

  try {
    const [minX, minY, maxX, maxY] = turf.bbox(feature);
    return [minX, minY, maxX, maxY];
  } catch {
    return null;
  }
}

export function buildManualBoundaryUploadPayload(
  farmId: number,
  unit: 'acre' | 'hectare' | 'bigha',
  points: BoundaryPoint[],
  gpsAccuracyLabel: string,
  options?: {
    mappingStartedAt?: string | null;
    mappingFinishedAt?: string | null;
    status?: string;
    mapType?: 'satellite' | 'standard';
    mapProvider?: string;
    mapStyle?: string;
    captureMethod?: string;
    officerLatitude?: number | null;
    officerLongitude?: number | null;
    officerAccuracy?: number | null;
    village?: string | null;
    taluka?: string | null;
    district?: string | null;
    state?: string | null;
    postcode?: string | null;
  },
) {
  const latLng = points.map((point) => ({ latitude: point.latitude, longitude: point.longitude }));
  const validation = validateManualPolygon(points);
  const metrics = validation.metrics ?? calculateBoundaryMetrics(latLng);
  const center = polygonCentroid(latLng);
  const polygonFeature = buildPolygonFeature(latLng);

  return {
    farm_id: farmId,
    unit,
    capture_method: options?.captureMethod ?? 'manual_hybrid_tap',
    area_acre: metrics.areaAcre,
    area_hectare: metrics.areaHectare,
    area_bigha: metrics.areaBigha,
    area_sqft: metrics.areaSquareFeet,
    area_square_meters: metrics.areaSquareMeters,
    actual_area_acre: metrics.areaAcre,
    actual_area_hectare: metrics.areaHectare,
    perimeter_meter: metrics.perimeterMeter,
    total_distance_meters: 0,
    gps_accuracy: gpsAccuracyLabel.toLowerCase(),
    gps_accuracy_average: options?.officerAccuracy ?? points[0]?.accuracy ?? null,
    mapping_started_at: options?.mappingStartedAt ?? null,
    mapping_finished_at: options?.mappingFinishedAt ?? null,
    status: options?.status ?? 'completed',
    mapping_status: options?.status ?? 'completed',
    verification_status: 'pending_review',
    map_type: options?.mapType ?? 'satellite',
    map_provider: options?.mapProvider ?? 'maptiler_maplibre',
    map_style: options?.mapStyle ?? 'hybrid-v4',
    center_latitude: center?.latitude ?? options?.officerLatitude ?? points[0]?.latitude ?? null,
    center_longitude: center?.longitude ?? options?.officerLongitude ?? points[0]?.longitude ?? null,
    field_officer_latitude: options?.officerLatitude ?? null,
    field_officer_longitude: options?.officerLongitude ?? null,
    village: options?.village ?? null,
    taluka: options?.taluka ?? null,
    district: options?.district ?? null,
    state: options?.state ?? null,
    postcode: options?.postcode ?? null,
    polygon_geojson: polygonFeature,
    boundary_points: points.map((point) => ({
      point_no: point.pointNo,
      sequence: point.pointNo,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracy: point.accuracy,
      altitude: point.altitude ?? null,
      timestamp: point.timestamp,
      is_manual: true,
    })),
    walking_boundary_points: [],
    edited_boundary_points: points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })),
  };
}
