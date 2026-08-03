import { Alert } from 'react-native';

import {
  artisanGpsAccuracyLabel,
  classifyArtisanGpsAccuracy,
  type ArtisanGpsAccuracyTier,
} from './artisanGpsAccuracy';
import { resolveValidatedCaptureLocation, normalizeCaptureLocationPart } from './livePhotoLocation';
import { captureHighAccuracyGps } from './officerGpsCapture';

export const BIOCHAR_POOR_ACCURACY_MESSAGE =
  'GPS accuracy is too low (over 30 m). Move outdoors, wait a few seconds, then tap Retry GPS.';

export interface BiocharGpsCaptureResult {
  latitude: number;
  longitude: number;
  accuracyM: number;
  accuracyTier: ArtisanGpsAccuracyTier;
  isPoorAccuracy: boolean;
  altitude: number | null;
  capturedAt: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  locationResolved: boolean;
  /** Single-line address built from reverse-geocode parts. */
  address: string;
}

export function biocharGpsAccuracyLabel(tier: ArtisanGpsAccuracyTier): string {
  return artisanGpsAccuracyLabel(tier);
}

export async function captureBiocharGps(): Promise<BiocharGpsCaptureResult> {
  const position = await captureHighAccuracyGps();
  const validated = await resolveValidatedCaptureLocation(position.latitude, position.longitude);
  const accuracyTier = classifyArtisanGpsAccuracy(position.accuracyM);
  const village = normalizeCaptureLocationPart(validated.village);
  const taluka = normalizeCaptureLocationPart(validated.taluka);
  const district = normalizeCaptureLocationPart(validated.district);
  const state = normalizeCaptureLocationPart(validated.state) || 'Gujarat';
  const address = [village, taluka, district, state]
    .map((part) => part.trim())
    .filter((part) => part && part !== '-' && part !== '—')
    .join(', ');

  return {
    latitude: position.latitude,
    longitude: position.longitude,
    accuracyM: position.accuracyM,
    accuracyTier,
    isPoorAccuracy: accuracyTier === 'poor',
    altitude: position.altitude,
    capturedAt: position.timestamp,
    village,
    taluka,
    district,
    state,
    locationResolved: validated.resolved,
    address,
  };
}

export function showBiocharPoorAccuracyWarning(): void {
  Alert.alert('GPS accuracy is low', BIOCHAR_POOR_ACCURACY_MESSAGE);
}
