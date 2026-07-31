import areaImport from '@turf/area';
import { lineString, polygon } from '@turf/helpers';
import kinksImport from '@turf/kinks';

const area = (typeof areaImport === 'function' ? areaImport : (areaImport as { default: typeof areaImport }).default) as typeof areaImport;
const kinks = (typeof kinksImport === 'function' ? kinksImport : (kinksImport as { default: typeof kinksImport }).default) as typeof kinksImport;

export type LatLng = { latitude: number; longitude: number };

export type BoundaryPoint = {
  id: string;
  pointNo: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
};

export type AreaMetrics = {
  areaSquareMeters: number;
  areaSquareFeet: number;
  areaAcres: number;
  areaHectares: number;
};

export const MIN_BOUNDARY_POINTS = 3;
export const SQUARE_FEET_PER_SQUARE_METER = 10.7639;
export const SQUARE_METERS_PER_ACRE = 4046.8564224;
export const SQUARE_METERS_PER_HECTARE = 10000;
export const MIN_TAP_DEBOUNCE_MS = 350;
export const DUPLICATE_POINT_EPSILON = 0.0000008;

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
  );
}

export function pointsTooClose(a: LatLng, b: LatLng): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < DUPLICATE_POINT_EPSILON
    && Math.abs(a.longitude - b.longitude) < DUPLICATE_POINT_EPSILON
  );
}

export function createBoundaryPoint(
  coordinate: LatLng,
  pointNo: number,
  accuracy?: number | null,
): BoundaryPoint {
  return {
    id: `pt-${pointNo}`,
    pointNo,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    accuracy: accuracy ?? null,
    timestamp: new Date().toISOString(),
  };
}

function toRing(points: LatLng[]): [number, number][] {
  const ring = points.map((p) => [p.longitude, p.latitude] as [number, number]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

export function calculateAreaMetrics(points: LatLng[]): AreaMetrics | null {
  if (points.length < MIN_BOUNDARY_POINTS) {
    return null;
  }

  try {
    const feature = polygon([toRing(points)]);
    const kinkCount = kinks(feature).features.length;
    if (kinkCount > 0) {
      return null;
    }

    const squareMeters = Math.abs(area(feature));
    if (!(squareMeters > 0) || !Number.isFinite(squareMeters)) {
      return null;
    }

    return {
      areaSquareMeters: Number(squareMeters.toFixed(2)),
      areaSquareFeet: Number((squareMeters * SQUARE_FEET_PER_SQUARE_METER).toFixed(2)),
      areaAcres: Number((squareMeters / SQUARE_METERS_PER_ACRE).toFixed(4)),
      areaHectares: Number((squareMeters / SQUARE_METERS_PER_HECTARE).toFixed(4)),
    };
  } catch {
    return null;
  }
}

export function validatePolygon(points: LatLng[]): { valid: boolean; message: string | null; metrics: AreaMetrics | null } {
  if (points.length < MIN_BOUNDARY_POINTS) {
    return {
      valid: false,
      message: 'Please add at least 3 boundary points to submit.',
      metrics: null,
    };
  }

  for (const point of points) {
    if (!isValidCoordinate(point.latitude, point.longitude)) {
      return { valid: false, message: 'Boundary contains invalid coordinates.', metrics: null };
    }
  }

  try {
    const feature = polygon([toRing(points)]);
    if (kinks(feature).features.length > 0) {
      return {
        valid: false,
        message: 'Boundary crosses itself. Adjust points so sides do not intersect.',
        metrics: null,
      };
    }
  } catch {
    return { valid: false, message: 'Unable to validate polygon geometry.', metrics: null };
  }

  const metrics = calculateAreaMetrics(points);
  if (!metrics) {
    return { valid: false, message: 'Boundary area must be greater than zero.', metrics: null };
  }

  return { valid: true, message: null, metrics };
}

export function formatAreaBlocks(metrics: AreaMetrics): string[] {
  return [
    `Square metres: ${metrics.areaSquareMeters.toFixed(2)}`,
    `Square feet: ${metrics.areaSquareFeet.toFixed(2)}`,
    `Acres: ${metrics.areaAcres.toFixed(4)}`,
    `Hectares: ${metrics.areaHectares.toFixed(4)}`,
  ];
}

export function emptyFeatureCollection() {
  return { type: 'FeatureCollection' as const, features: [] as never[] };
}

export function buildPolygonFeature(points: LatLng[]) {
  if (points.length < MIN_BOUNDARY_POINTS) {
    return null;
  }
  try {
    return polygon([toRing(points)]);
  } catch {
    return null;
  }
}

export function buildLineFeature(points: LatLng[]) {
  if (points.length < 2) {
    return null;
  }
  try {
    return lineString(points.map((p) => [p.longitude, p.latitude]));
  } catch {
    return null;
  }
}

export function buildVerticesFeatureCollection(
  points: BoundaryPoint[],
  selectedPointId: string | null,
) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map((point, index) => ({
      type: 'Feature' as const,
      properties: {
        id: point.id,
        isFirst: index === 0,
        isSelected: point.id === selectedPointId,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };
}

export function polygonBounds(points: LatLng[]): [number, number, number, number] | null {
  if (points.length === 0) {
    return null;
  }
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;
  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  for (const point of points) {
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
  }
  return [minLng, minLat, maxLng, maxLat];
}
