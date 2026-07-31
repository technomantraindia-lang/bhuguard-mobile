import { Alert } from 'react-native';

import {
  artisanGpsAccuracyLabel,
  classifyArtisanGpsAccuracy,
  type ArtisanGpsAccuracyTier,
} from './artisanGpsAccuracy';
import { resolveValidatedCaptureLocation } from './livePhotoLocation';
import { captureHighAccuracyGps } from './officerGpsCapture';

export const BIOCHAR_POOR_ACCURACY_MESSAGE =
  'GPS accuracy is too low (over 100 m). Move outdoors, wait a few seconds, then try again.';

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
}

export function biocharGpsAccuracyLabel(tier: ArtisanGpsAccuracyTier): string {
  return artisanGpsAccuracyLabel(tier);
}

export async function captureBiocharGps(): Promise<BiocharGpsCaptureResult> {
  const position = await captureHighAccuracyGps();
  const validated = await resolveValidatedCaptureLocation(position.latitude, position.longitude);
  const accuracyTier = classifyArtisanGpsAccuracy(position.accuracyM);

  return {
    latitude: position.latitude,
    longitude: position.longitude,
    accuracyM: position.accuracyM,
    accuracyTier,
    isPoorAccuracy: accuracyTier === 'poor',
    altitude: position.altitude,
    capturedAt: position.timestamp,
    village: validated.village,
    taluka: validated.taluka,
    district: validated.district,
    state: validated.state,
    locationResolved: validated.resolved,
  };
}

export function showBiocharPoorAccuracyWarning(): void {
  Alert.alert('GPS accuracy is low', BIOCHAR_POOR_ACCURACY_MESSAGE);
}
