import { Linking } from 'react-native';

import {
  accuracyTierLabel,
  calculateDistanceInMeters,
  classifyAccuracyTier,
  getCurrentLocationDetailed,
  getLocationPermissionStatus,
  isLocationServiceEnabled,
  isValidCoordinates,
  openDeviceSettings,
  openLocationSettings,
  requestLocationPermission,
  type CurrentLocationResult,
  type GpsAccuracyTier,
  type GpsPermissionStatus,
} from './locationUtils';

export type { GpsAccuracyTier, GpsPermissionStatus };
export type OfficerGpsCaptureResult = CurrentLocationResult;

export { accuracyTierLabel, classifyAccuracyTier, isValidCoordinates };

export async function getGpsPermissionStatus(): Promise<GpsPermissionStatus> {
  return getLocationPermissionStatus();
}

export async function requestGpsPermission(): Promise<GpsPermissionStatus> {
  const result = await requestLocationPermission();

  if (result.granted) {
    return 'granted';
  }

  return result.canAskAgain ? 'undetermined' : 'denied';
}

export { isLocationServiceEnabled, openDeviceSettings, openLocationSettings };

export interface GpsCaptureOptions {
  maxAttempts?: number;
  targetAccuracyM?: number;
  timeoutMs?: number;
}

export async function captureHighAccuracyGps(
  options: GpsCaptureOptions = {},
): Promise<OfficerGpsCaptureResult> {
  return getCurrentLocationDetailed({
    timeoutMs: options.timeoutMs ?? 25000,
    maxAttempts: options.maxAttempts ?? 4,
    targetAccuracyM: options.targetAccuracyM ?? 25,
  });
}

export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export async function openGoogleMaps(latitude: number, longitude: number): Promise<void> {
  await Linking.openURL(buildGoogleMapsUrl(latitude, longitude));
}

export function buildStaticMapPreviewUrl(
  officerLat: number,
  officerLng: number,
  farmLat: number,
  farmLng: number,
): string {
  const centerLat = (officerLat + farmLat) / 2;
  const centerLng = (officerLng + farmLng) / 2;

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=16&size=640x360&markers=${officerLat},${officerLng},lightblue1|${farmLat},${farmLng},red`;
}

export { calculateDistanceInMeters };
