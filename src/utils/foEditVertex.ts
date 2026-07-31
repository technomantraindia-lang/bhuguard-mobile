import type { LngLat } from './lngLat';

import {
  type AreaMetrics,
  type BoundaryPoint,
  type LatLng,
  DUPLICATE_POINT_EPSILON,
  MIN_BOUNDARY_POINTS,
  calculateAreaMetrics,
  isValidCoordinate,
  validatePolygon,
} from './foBoundaryGeometry';

export const INVALID_BOUNDARY_POINT_MESSAGE = 'This point creates an invalid boundary.';

export type LngLatTuple = [longitude: number, latitude: number];

export type UpdateEditableVertexResult =
  | { ok: true; coordinates: LatLng[] }
  | { ok: false; reason: 'out_of_range' | 'invalid_coordinate' | 'duplicate_consecutive' | 'unchanged' };

export function isValidLngLat(lngLat: LngLat | LngLatTuple | null | undefined): lngLat is LngLatTuple {
  if (!lngLat || !Array.isArray(lngLat) || lngLat.length < 2) {
    return false;
  }
  const [longitude, latitude] = lngLat;
  return isValidCoordinate(latitude, longitude);
}

export function lngLatToLatLng(lngLat: LngLatTuple): LatLng {
  return { longitude: lngLat[0], latitude: lngLat[1] };
}

export function latLngToLngLat(point: LatLng): LngLatTuple {
  return [point.longitude, point.latitude];
}

export function pointsToLatLngList(points: BoundaryPoint[]): LatLng[] {
  return points.map((point) => ({
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

export function applyLngLatToBoundaryPoints(
  points: BoundaryPoint[],
  index: number,
  lngLat: LngLatTuple,
): BoundaryPoint[] {
  return points.map((point, currentIndex) =>
    currentIndex === index
      ? {
          ...point,
          longitude: lngLat[0],
          latitude: lngLat[1],
          timestamp: new Date().toISOString(),
        }
      : point,
  );
}

/**
 * Immutable open-ring vertex update. Does not append a closing coordinate.
 */
export function updateEditableVertex(
  coordinates: LatLng[],
  index: number,
  nextLngLat: LngLat | LngLatTuple,
): UpdateEditableVertexResult {
  if (index < 0 || index >= coordinates.length) {
    return { ok: false, reason: 'out_of_range' };
  }
  if (!isValidLngLat(nextLngLat)) {
    return { ok: false, reason: 'invalid_coordinate' };
  }

  const next = lngLatToLatLng(nextLngLat);
  const current = coordinates[index];
  if (
    current
    && Math.abs(current.latitude - next.latitude) < DUPLICATE_POINT_EPSILON
    && Math.abs(current.longitude - next.longitude) < DUPLICATE_POINT_EPSILON
  ) {
    return { ok: false, reason: 'unchanged' };
  }

  if (coordinates.length > 1) {
    const prev = coordinates[(index - 1 + coordinates.length) % coordinates.length];
    const following = coordinates[(index + 1) % coordinates.length];
    if (
      prev
      && Math.abs(prev.latitude - next.latitude) < DUPLICATE_POINT_EPSILON
      && Math.abs(prev.longitude - next.longitude) < DUPLICATE_POINT_EPSILON
    ) {
      return { ok: false, reason: 'duplicate_consecutive' };
    }
    if (
      following
      && Math.abs(following.latitude - next.latitude) < DUPLICATE_POINT_EPSILON
      && Math.abs(following.longitude - next.longitude) < DUPLICATE_POINT_EPSILON
    ) {
      return { ok: false, reason: 'duplicate_consecutive' };
    }
  }

  const updated = coordinates.map((coordinate, currentIndex) =>
    (currentIndex === index ? { ...next } : { ...coordinate }),
  );

  return { ok: true, coordinates: updated };
}

/**
 * Closed ring for GeoJSON polygon construction only. Does not invent markers.
 */
export function toClosedRing(openCoords: LatLng[]): LngLatTuple[] {
  if (openCoords.length === 0) {
    return [];
  }
  const ring: LngLatTuple[] = openCoords.map((point) => [point.longitude, point.latitude]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

export function validateEditablePolygon(openCoords: LatLng[]): {
  valid: boolean;
  message: string | null;
  metrics: AreaMetrics | null;
} {
  if (openCoords.length < MIN_BOUNDARY_POINTS) {
    return {
      valid: false,
      message: 'Please add at least 3 boundary points to submit.',
      metrics: null,
    };
  }
  return validatePolygon(openCoords);
}

export function recalculateEditableArea(openCoords: LatLng[]): AreaMetrics | null {
  if (openCoords.length < MIN_BOUNDARY_POINTS) {
    return null;
  }
  return calculateAreaMetrics(openCoords);
}

export function restoreVertexFromSnapshot(
  current: BoundaryPoint[],
  snapshot: BoundaryPoint[],
  index: number,
): BoundaryPoint[] {
  const source = snapshot[index];
  if (!source || index < 0 || index >= current.length) {
    return current.map((point) => ({ ...point }));
  }
  return current.map((point, currentIndex) =>
    (currentIndex === index
      ? {
          ...point,
          latitude: source.latitude,
          longitude: source.longitude,
          timestamp: source.timestamp,
        }
      : { ...point }),
  );
}

export function cloneBoundaryPoints(points: BoundaryPoint[]): BoundaryPoint[] {
  return points.map((point) => ({ ...point }));
}
