import { Linking, Platform } from 'react-native';

import type { ApiRecord } from './apiHelpers';
import { pickString } from './apiHelpers';
import {
  convertFarmAreaFromRecord,
  formatFarmerHectareOnlyDisplay,
  formatHectares,
  sumFarmAreasHectares,
  type FarmAreaDisplayLabels,
  type FarmAreaTriple,
} from './farmAreaUnits';
import { resolveFarmIdentityLabelCoordinate } from './farmIdentityMapLabel';
import type { LatLng } from './farmSatelliteMap';

export interface FarmCoordinates {
  latitude: number;
  longitude: number;
}

export type FarmVerificationBadge = 'verified' | 'pending' | 'draft';
export type FarmMappingBadge = 'mapped' | 'not_mapped';

export interface FarmerFarmViewModel {
  id: number;
  name: string;
  code: string;
  farmerName: string;
  farmerDisplayId: string;
  village: string;
  areaLabel: string;
  hectareLabel: string;
  squareMeterLabel: string;
  areaDisplay: FarmAreaDisplayLabels;
  areaTriple: FarmAreaTriple | null;
  imageUrl: string | null;
  cropLabel: string;
  soilLabel: string;
  verificationBadge: FarmVerificationBadge;
  mappingBadge: FarmMappingBadge;
  boundaryMapped: boolean;
  boundaryPointCount: number;
  coordinates: FarmCoordinates | null;
  locationLabel: string;
}

function parseNumber(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function parsePolygonPoint(point: unknown): LatLng | null {
  if (!point || typeof point !== 'object') {
    if (Array.isArray(point) && point.length >= 2) {
      const latitude = parseNumber(point[0]);
      const longitude = parseNumber(point[1]);

      if (latitude === null || longitude === null) {
        return null;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return null;
      }

      return { latitude, longitude };
    }

    return null;
  }

  const record = point as Record<string, unknown>;
  const latitude = parseNumber(record.latitude ?? record.lat);
  const longitude = parseNumber(record.longitude ?? record.lng ?? record.lon);

  if (latitude === null || longitude === null) {
    return null;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  return { latitude, longitude };
}

export function parseStoredFarmPolygon(farm: ApiRecord): LatLng[] {
  const raw = farm.gps_polygon;

  if (!Array.isArray(raw) || raw.length < 3) {
    return [];
  }

  return raw.map(parsePolygonPoint).filter((point): point is LatLng => point !== null);
}

export function getFarmCoordinates(farm: ApiRecord): FarmCoordinates | null {
  const lat = parseNumber(farm.gps_latitude ?? farm.latitude);
  const lng = parseNumber(farm.gps_longitude ?? farm.longitude);

  if (lat === null || lng === null) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { latitude: lat, longitude: lng };
}

export function resolveFarmMapCoordinate(farm: ApiRecord): FarmCoordinates | null {
  const polygon = parseStoredFarmPolygon(farm);
  const farmGps = getFarmCoordinates(farm);

  return resolveFarmIdentityLabelCoordinate({
    polygon,
    farmGps,
  });
}

export function isFarmMapped(farm: ApiRecord): boolean {
  if (farm.boundary_mapped === true) {
    return true;
  }

  const polygon = farm.gps_polygon;

  if (Array.isArray(polygon) && polygon.length >= 3) {
    return true;
  }

  const status = pickString(farm, 'boundary_status', 'mapping_status').toLowerCase();

  return ['mapped', 'verified', 'completed'].includes(status);
}

export function getFarmVerificationBadge(farm: ApiRecord): FarmVerificationBadge {
  const status = pickString(farm, 'status', 'verification_status').toLowerCase();

  if (['verified', 'active', 'approved'].includes(status)) {
    return 'verified';
  }

  if (['draft', 'inactive'].includes(status)) {
    return 'draft';
  }

  return 'pending';
}

export function getFarmAreaTriple(farm: ApiRecord): FarmAreaTriple | null {
  return convertFarmAreaFromRecord(farm as Record<string, unknown>);
}

export function getFarmAreaLabel(farm: ApiRecord): string {
  return formatHectares(getFarmAreaTriple(farm)?.hectares ?? null, 4);
}

export function getFarmCode(farm: ApiRecord): string {
  const display = pickString(farm, 'farm_display_id', 'display_id');

  if (display !== '-') {
    return display;
  }

  const code = pickString(farm, 'farm_code');

  if (code !== '-') {
    return code;
  }

  return 'ID Pending';
}

export function getFarmLocationLabel(farm: ApiRecord): string {
  const parts = [
    pickString(farm, 'village'),
    pickString(farm, 'taluka', 'taluka_name'),
    pickString(farm, 'district', 'district_name'),
    pickString(farm, 'state'),
  ].filter((part) => part && part !== '-');

  return parts.length > 0 ? parts.join(', ') : 'Location not set';
}

function resolveFarmImageUrl(farm: ApiRecord): string | null {
  const candidates = [
    farm.primary_image_url,
    farm.farm_image_url,
    farm.photo_url,
    farm.cover_image_url,
    farm.latest_image_url,
    farm.image_url,
  ];

  for (const candidate of candidates) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    if (value && !value.includes('evidence') && !value.includes('aadhaar') && !value.includes('pan')) {
      return value;
    }
  }

  return null;
}

export function mapFarmRecord(farm: ApiRecord): FarmerFarmViewModel {
  const coordinates = resolveFarmMapCoordinate(farm);
  const mapped = isFarmMapped(farm);
  const areaTriple = getFarmAreaTriple(farm);
  const areaDisplay = formatFarmerHectareOnlyDisplay(areaTriple);
  const hectareLabel = formatHectares(areaTriple?.hectares ?? null, 4);

  return {
    id: Number(farm.id ?? farm.farm_id),
    name: pickString(farm, 'farm_name', 'name') !== '-' ? pickString(farm, 'farm_name', 'name') : `Farm ${farm.id}`,
    code: getFarmCode(farm),
    farmerName:
      pickString(farm, 'farmer_name', 'farmerName', 'owner_name') !== '-'
        ? pickString(farm, 'farmer_name', 'farmerName', 'owner_name')
        : '',
    farmerDisplayId:
      pickString(farm, 'farmer_display_id', 'farmer_id', 'farmer_code') !== '-'
        ? pickString(farm, 'farmer_display_id', 'farmer_id', 'farmer_code')
        : '',
    village: pickString(farm, 'village') !== '-' ? pickString(farm, 'village') : '—',
    areaLabel: hectareLabel,
    hectareLabel,
    squareMeterLabel: hectareLabel,
    areaDisplay,
    areaTriple,
    imageUrl: resolveFarmImageUrl(farm),
    cropLabel: pickString(farm, 'crop_type', 'current_crop') !== '-' ? pickString(farm, 'crop_type', 'current_crop') : '—',
    soilLabel: pickString(farm, 'soil_type') !== '-' ? pickString(farm, 'soil_type') : '—',
    verificationBadge: getFarmVerificationBadge(farm),
    mappingBadge: mapped ? 'mapped' : 'not_mapped',
    boundaryMapped: mapped,
    boundaryPointCount: Number(farm.boundary_point_count ?? 0),
    coordinates,
    locationLabel: getFarmLocationLabel(farm),
  };
}

export function buildStaticMapUrl(coordinates: FarmCoordinates[], width = 640, height = 280): string | null {
  if (coordinates.length === 0) {
    return null;
  }

  const center = coordinates[0];
  const markerParam = coordinates
    .slice(0, 5)
    .map((point) => `${point.latitude},${point.longitude},red-pushpin`)
    .join('|');

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center.latitude},${center.longitude}&zoom=13&size=${width}x${height}&maptype=mapnik&markers=${encodeURIComponent(markerParam)}`;
}

export async function openGoogleMaps(coordinates: FarmCoordinates, label?: string): Promise<void> {
  const { latitude, longitude } = coordinates;
  const encodedLabel = label ? encodeURIComponent(label) : '';
  const labelSuffix = label ? `(${encodedLabel})` : '';
  const query = `${latitude},${longitude}`;

  const candidates: string[] = Platform.select({
    android: [
      `google.navigation:q=${query}${label ? `&title=${encodedLabel}` : ''}`,
      `geo:${query}?q=${query}${labelSuffix}`,
      `https://www.google.com/maps/dir/?api=1&destination=${query}`,
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    ],
    ios: [
      `comgooglemaps://?daddr=${query}&directionsmode=driving`,
      `maps://?daddr=${query}`,
      `https://www.google.com/maps/dir/?api=1&destination=${query}`,
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    ],
    default: [
      `https://www.google.com/maps/dir/?api=1&destination=${query}`,
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    ],
  }) ?? [`https://www.google.com/maps/search/?api=1&query=${query}`];

  for (const url of candidates) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Try the next candidate.
    }
  }

  await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}

export function buildFarmSummary(farms: FarmerFarmViewModel[]) {
  let verifiedCount = 0;
  let pendingCount = 0;

  for (const farm of farms) {
    if (farm.verificationBadge === 'verified') {
      verifiedCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  const totalHectares = sumFarmAreasHectares(farms);

  return {
    totalFarms: farms.length,
    totalLandLabel: totalHectares > 0 ? formatHectares(totalHectares, 2) : '—',
    verifiedCount,
    pendingCount,
  };
}
