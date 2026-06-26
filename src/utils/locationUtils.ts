import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export type GpsAccuracyTier = 'good' | 'average' | 'poor' | 'unknown';

export type GpsPermissionStatus = 'granted' | 'denied' | 'undetermined';

export const DEFAULT_ALLOWED_RADIUS_METERS = 100;
export const MAX_ALLOWED_ACCURACY_METERS = 100;

export function classifyAccuracyTier(accuracyM: number | null | undefined): GpsAccuracyTier {
  if (accuracyM == null || !Number.isFinite(accuracyM)) {
    return 'unknown';
  }

  if (accuracyM <= 50) {
    return 'good';
  }

  if (accuracyM <= 100) {
    return 'average';
  }

  return 'poor';
}

export function accuracyTierLabel(tier: GpsAccuracyTier): string {
  switch (tier) {
    case 'good':
      return 'Good';
    case 'average':
      return 'Average';
    case 'poor':
      return 'Poor';
    default:
      return 'Unknown';
  }
}

export function calculateDistanceInMeters(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined,
): number | null {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return null;
  }

  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return Math.round(2 * earthRadius * Math.asin(Math.min(1, Math.sqrt(a))));
}

export function formatDistance(distance: number | null | undefined): string {
  if (distance == null || !Number.isFinite(distance)) {
    return '—';
  }

  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distance)} m`;
}

export function isInsideRadius(
  distance: number | null | undefined,
  allowedRadius: number | null | undefined,
): boolean {
  if (
    distance == null ||
    allowedRadius == null ||
    !Number.isFinite(distance) ||
    !Number.isFinite(allowedRadius)
  ) {
    return false;
  }

  return distance <= allowedRadius;
}

export function getAccuracyStatus(accuracyM: number | null | undefined): GpsAccuracyTier {
  return classifyAccuracyTier(accuracyM);
}

export function canSubmitGpsCheckIn(options: {
  permissionGranted: boolean;
  hasCapture: boolean;
  hasFarmCoordinates: boolean;
  accuracyM: number | null | undefined;
  distanceMeters: number | null;
  allowedRadiusMeters: number;
  insideRadius: boolean;
}): boolean {
  if (!options.permissionGranted || !options.hasCapture || !options.hasFarmCoordinates) {
    return false;
  }

  if (getAccuracyStatus(options.accuracyM) === 'poor') {
    return false;
  }

  if (options.distanceMeters == null) {
    return false;
  }

  return options.insideRadius;
}

export interface LocationPermissionResult {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
}

export async function requestLocationPermissionDetailed(): Promise<LocationPermissionResult> {
  const result = await Location.requestForegroundPermissionsAsync();

  return {
    granted: result.granted,
    status: result.status,
    canAskAgain: result.canAskAgain ?? true,
  };
}

export interface GpsLocationCapture {
  latitude: number;
  longitude: number;
  accuracy: number;
  captured_at: string;
}

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  return requestLocationPermissionDetailed();
}

export async function getLocationPermissionStatusValue(): Promise<GpsPermissionStatus> {
  const permission = await Location.getForegroundPermissionsAsync();

  if (permission.granted) {
    return 'granted';
  }

  if (permission.canAskAgain === false) {
    return 'denied';
  }

  return 'undetermined';
}

export async function getLocationPermissionStatus(): Promise<GpsPermissionStatus> {
  return getLocationPermissionStatusValue();
}

export async function isLocationServiceEnabled(): Promise<boolean> {
  return Location.hasServicesEnabledAsync();
}

export async function openDeviceSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function openLocationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      return;
    } catch {
      // fall through
    }
  }

  await Linking.openSettings();
}

export function isValidCoordinates(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }

  return !(Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001);
}

export interface CurrentLocationResult {
  latitude: number;
  longitude: number;
  accuracyM: number;
  accuracyTier: GpsAccuracyTier;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
  provider: string | null;
}

function mapPosition(position: Location.LocationObject): CurrentLocationResult {
  const accuracyM = position.coords.accuracy ?? 0;

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyM,
    accuracyTier: classifyAccuracyTier(accuracyM),
    altitude: position.coords.altitude ?? null,
    heading: position.coords.heading ?? null,
    speed: position.coords.speed ?? null,
    timestamp: new Date(position.timestamp).toISOString(),
    provider: Platform.OS,
  };
}

export async function getCurrentLocation(): Promise<GpsLocationCapture> {
  const detailed = await getCurrentLocationDetailed();

  return {
    latitude: detailed.latitude,
    longitude: detailed.longitude,
    accuracy: detailed.accuracyM,
    captured_at: detailed.timestamp,
  };
}

export async function getCurrentLocationDetailed(): Promise<CurrentLocationResult> {
  const permission = await requestLocationPermissionDetailed();

  if (!permission.granted) {
    throw new Error('Location permission is required for GPS check-in.');
  }

  const servicesEnabled = await isLocationServiceEnabled();

  if (!servicesEnabled) {
    throw new Error('Please enable location services to continue.');
  }

  let best: CurrentLocationResult | null = null;

  try {
    const lastKnown = await Location.getLastKnownPositionAsync();

    if (lastKnown && isValidCoordinates(lastKnown.coords.latitude, lastKnown.coords.longitude)) {
      best = mapPosition(lastKnown);
    }
  } catch {
    // Ignore last-known failures.
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });

    if (!isValidCoordinates(position.coords.latitude, position.coords.longitude)) {
      continue;
    }

    const mapped = mapPosition(position);

    if (!best || mapped.accuracyM < best.accuracyM) {
      best = mapped;
    }

    if (mapped.accuracyM <= 25) {
      return mapped;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  if (!best) {
    throw new Error('Unable to capture GPS location. Move to open sky and try again.');
  }

  return best;
}
