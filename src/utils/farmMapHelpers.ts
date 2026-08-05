import { Linking, Platform } from 'react-native';

import type { ApiRecord } from './apiHelpers';
import { pickString } from './apiHelpers';

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
  village: string;
  areaLabel: string;
  hectareLabel: string;
  bighaLabel: string;
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

export function isFarmMapped(farm: ApiRecord): boolean {
  if (farm.boundary_mapped === true) {
    return true;
  }

  const polygon = farm.gps_polygon;

  if (Array.isArray(polygon) && polygon.length >= 3) {
    return true;
  }

  const status = pickString(farm, 'boundary_status').toLowerCase();

  return ['mapped', 'verified'].includes(status);
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

export function getFarmAreaLabel(farm: ApiRecord): string {
  const area = parseNumber(farm.land_area ?? farm.area_acres);

  if (area === null || area <= 0) {
    return '—';
  }

  const unitRaw = pickString(farm, 'land_area_unit', 'area_unit').toLowerCase();
  // Phase 12.3 — Farmer mobile UI shows Acre / Hectare only. Convert Bigha for display.
  let displayArea = area;
  let unitLabel = 'Acres';

  if (unitRaw.includes('hect')) {
    unitLabel = 'Hectares';
  } else if (unitRaw.includes('bigha')) {
    displayArea = area / 1.613;
    unitLabel = 'Acres';
  } else {
    unitLabel = 'Acres';
  }

  const formatted = displayArea % 1 === 0 ? displayArea.toFixed(0) : displayArea.toFixed(2);
  return `${formatted} ${unitLabel}`;
}

// Never fabricate a local farm code (e.g. "BG-FARM-000") — Farm ID is either
// the server-issued farm_code or the existing numeric farm id, per Phase 6/12.
export function getFarmCode(farm: ApiRecord): string {
  const code = pickString(farm, 'farm_code');

  if (code !== '-') {
    return code;
  }

  const id = pickString(farm, 'id');

  return id !== '-' ? id : '—';
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

export function mapFarmRecord(farm: ApiRecord): FarmerFarmViewModel {
  const coordinates = getFarmCoordinates(farm);
  const mapped = isFarmMapped(farm);
  const acres = Number(farm.area_acres ?? farm.land_area ?? 0);
  const hectares = Number(farm.area_hectares ?? (acres ? acres * 0.404686 : 0));
  // Keep bigha calc for stored conversion only — never shown in Farmer UI.
  const bigha = acres ? acres * 1.613 : 0;

  return {
    id: Number(farm.id),
    name: pickString(farm, 'farm_name', 'name') !== '-' ? pickString(farm, 'farm_name', 'name') : `Farm ${farm.id}`,
    code: getFarmCode(farm),
    farmerName:
      pickString(farm, 'farmer_name', 'farmerName', 'owner_name') !== '-'
        ? pickString(farm, 'farmer_name', 'farmerName', 'owner_name')
        : '',
    village: pickString(farm, 'village') !== '-' ? pickString(farm, 'village') : '—',
    areaLabel: getFarmAreaLabel(farm),
    hectareLabel: hectares > 0 ? `${hectares.toFixed(2)} Hectare` : '—',
    bighaLabel: '', // Hidden from Farmer mobile UI (Phase 12.3).
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
  let totalLand = 0;
  let landUnit = 'Acres';
  let verifiedCount = 0;
  let pendingCount = 0;

  for (const farm of farms) {
    if (farm.verificationBadge === 'verified') {
      verifiedCount += 1;
    } else {
      pendingCount += 1;
    }

    const match = farm.areaLabel.match(/^([\d.]+)\s+(.+)$/);

    if (match) {
      totalLand += Number(match[1]);
      landUnit = match[2];
    }
  }

  return {
    totalFarms: farms.length,
    totalLandLabel: totalLand > 0 ? `${totalLand % 1 === 0 ? totalLand.toFixed(0) : totalLand.toFixed(1)} ${landUnit}` : '—',
    verifiedCount,
    pendingCount,
  };
}
