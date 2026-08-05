import type { LatLng } from './farmSatelliteMap';
import { pointInPolygon } from './boundaryGeometry';
import { polygonCentroid } from './manualBoundaryGeometry';

export type FarmIdentityLabelData = {
  coordinate: LatLng;
  farmName: string;
  farmId: string;
  farmerName: string;
  farmerId: string;
};

/**
 * Resolve a stable map coordinate for the selected-farm identity label.
 * Priority: safe interior point → polygon centroid → farm GPS → boundary center.
 * Returns null when no real coordinate exists (never invents).
 */
export function resolveFarmIdentityLabelCoordinate(options: {
  polygon: LatLng[];
  farmGps?: LatLng | null;
  center?: LatLng | null;
}): LatLng | null {
  const polygon = options.polygon.filter(
    (point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );

  if (polygon.length >= 3) {
    const centroid = polygonCentroid(polygon);
    if (centroid && pointInPolygon(centroid, polygon)) {
      return centroid;
    }

    // Average of vertices is usually inside convex polygons; still verify.
    const avg = {
      latitude: polygon.reduce((sum, point) => sum + point.latitude, 0) / polygon.length,
      longitude: polygon.reduce((sum, point) => sum + point.longitude, 0) / polygon.length,
    };
    if (pointInPolygon(avg, polygon)) {
      return avg;
    }

    // Prefer the first vertex that sits inside the ring (handles some concave shapes).
    for (const point of polygon) {
      if (pointInPolygon(point, polygon)) {
        return point;
      }
    }

    if (centroid) {
      return centroid;
    }
  }

  if (
    options.farmGps
    && Number.isFinite(options.farmGps.latitude)
    && Number.isFinite(options.farmGps.longitude)
  ) {
    return options.farmGps;
  }

  if (
    options.center
    && Number.isFinite(options.center.latitude)
    && Number.isFinite(options.center.longitude)
  ) {
    return options.center;
  }

  return null;
}
