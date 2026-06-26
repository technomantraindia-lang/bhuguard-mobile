import type { ApiRecord } from './apiHelpers';
import type { FarmCoordinates } from './farmMapHelpers';
import { getFarmCoordinates } from './farmMapHelpers';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface PixelPoint {
  x: number;
  y: number;
}

/** Map center fallback when farm has no GPS coordinates yet — not demo report data. */
const DEMO_CENTER: LatLng = { latitude: 23.0225, longitude: 72.5714 };

function parseNumber(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parsePolygonPoint(point: unknown): LatLng | null {
  if (!point || typeof point !== 'object') {
    return null;
  }

  const record = point as Record<string, unknown>;
  const lat = parseNumber(record.latitude ?? record.lat ?? record[1]);
  const lng = parseNumber(record.longitude ?? record.lng ?? record.lon ?? record[0]);

  if (lat === null || lng === null) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { latitude: lat, longitude: lng };
}

export function parseFarmPolygon(farm: ApiRecord, fallbackCenter?: LatLng | null, acres = 12.45): LatLng[] {
  const raw = farm.gps_polygon;

  if (Array.isArray(raw) && raw.length >= 3) {
    const points = raw.map(parsePolygonPoint).filter((point): point is LatLng => point !== null);

    if (points.length >= 3) {
      return points;
    }
  }

  const center = fallbackCenter ?? getFarmCoordinates(farm) ?? DEMO_CENTER;

  return buildDefaultFarmPolygon(center, acres);
}

export function buildDefaultFarmPolygon(center: LatLng, acres: number): LatLng[] {
  const sideMeters = Math.sqrt(acres * 4046.86);
  const latDelta = sideMeters / 111_320;
  const lngDelta = sideMeters / (111_320 * Math.cos((center.latitude * Math.PI) / 180));

  const halfLat = latDelta / 2;
  const halfLng = lngDelta / 2;

  return [
    { latitude: center.latitude - halfLat, longitude: center.longitude - halfLng },
    { latitude: center.latitude - halfLat, longitude: center.longitude + halfLng },
    { latitude: center.latitude + halfLat, longitude: center.longitude + halfLng },
    { latitude: center.latitude + halfLat, longitude: center.longitude - halfLng },
  ];
}

export function getPolygonBounds(points: LatLng[], paddingFactor = 0.22): MapBounds {
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);

  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  const latSpan = Math.max(maxLat - minLat, 0.0008);
  const lngSpan = Math.max(maxLng - minLng, 0.0008);
  const latPad = latSpan * paddingFactor;
  const lngPad = lngSpan * paddingFactor;

  minLat -= latPad;
  maxLat += latPad;
  minLng -= lngPad;
  maxLng += lngPad;

  return { minLat, maxLat, minLng, maxLng };
}

export function buildEsriSatelliteUrl(bounds: MapBounds, width: number, height: number): string {
  const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;

  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${encodeURIComponent(bbox)}&bboxSR=4326&imageSR=4326&size=${width},${height}&format=jpg&f=image`;
}

export function projectToPixels(
  point: LatLng,
  bounds: MapBounds,
  width: number,
  height: number,
): PixelPoint {
  const lngSpan = bounds.maxLng - bounds.minLng || 0.0001;
  const latSpan = bounds.maxLat - bounds.minLat || 0.0001;

  return {
    x: ((point.longitude - bounds.minLng) / lngSpan) * width,
    y: ((bounds.maxLat - point.latitude) / latSpan) * height,
  };
}

export function projectPolygonToPixels(
  points: LatLng[],
  bounds: MapBounds,
  width: number,
  height: number,
): PixelPoint[] {
  return points.map((point) => projectToPixels(point, bounds, width, height));
}

export function polygonCentroid(points: LatLng[]): LatLng {
  const total = points.length;
  const sum = points.reduce(
    (acc, point) => ({
      latitude: acc.latitude + point.latitude,
      longitude: acc.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: sum.latitude / total,
    longitude: sum.longitude / total,
  };
}

export function toSvgPath(points: PixelPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const [first, ...rest] = points;

  return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} ${rest.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')} Z`;
}

export function formatPolygonCoordinates(points: LatLng[]): string {
  return points
    .slice(0, 4)
    .map((point) => `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`)
    .join(' · ');
}

export function formatCoordinatePair(coordinates: FarmCoordinates | LatLng | null): string {
  if (!coordinates) {
    return '23.0225, 72.5714';
  }

  return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
}

export function getDemoCenter(): LatLng {
  return DEMO_CENTER;
}
