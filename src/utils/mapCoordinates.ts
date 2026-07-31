import type { LatLng } from './farmSatelliteMap';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 22.3072,
  longitude: 73.1812,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function isValidCoordinate(point?: LatLng | null): point is LatLng {
  const latitude = Number(point?.latitude);
  const longitude = Number(point?.longitude);

  return (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
  );
}

export function normalizeCoordinate(point: LatLng): LatLng {
  return {
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
  };
}

export function filterValidCoordinates(points: LatLng[]): LatLng[] {
  return points.filter(isValidCoordinate).map(normalizeCoordinate);
}

export function resolveInitialRegion(
  currentLocation?: LatLng | null,
  points: LatLng[] = [],
): MapRegion {
  if (isValidCoordinate(currentLocation)) {
    return {
      ...normalizeCoordinate(currentLocation),
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
  }

  const validPoints = filterValidCoordinates(points);

  if (validPoints.length > 0) {
    const latitudes = validPoints.map((point) => point.latitude);
    const longitudes = validPoints.map((point) => point.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.003, (maxLat - minLat) * 1.6 || 0.005),
      longitudeDelta: Math.max(0.003, (maxLng - minLng) * 1.6 || 0.005),
    };
  }

  return DEFAULT_MAP_REGION;
}
