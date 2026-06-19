import type { LatLng } from './farmSatelliteMap';
import { haversineMeters } from './boundaryGeometry';

export function boundingBoxDimensions(points: LatLng[]): { lengthMeter: number; widthMeter: number } {
  if (points.length === 0) {
    return { lengthMeter: 0, widthMeter: 0 };
  }

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;

  const length = haversineMeters(midLat, minLng, midLat, maxLng);
  const width = haversineMeters(minLat, midLng, maxLat, midLng);

  return {
    lengthMeter: Math.round(Math.max(length, width)),
    widthMeter: Math.round(Math.min(length, width)),
  };
}
