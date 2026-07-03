import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { logArtisanGps } from '../api/artisanApi';
import { captureHighAccuracyGps, type OfficerGpsCaptureResult } from '../utils/officerGpsCapture';
import {
  classifyArtisanGpsAccuracy,
  type ArtisanGpsAccuracyTier,
  type ArtisanGpsActivityStage,
} from '../utils/artisanGpsAccuracy';

interface UseArtisanGpsTrackerOptions {
  farmId?: number;
  batchId?: number | null;
}

interface CaptureGpsOptions {
  silent?: boolean;
  farmId?: number | null;
  biocharProductionId?: number | null;
  notes?: string | null;
}

export function useArtisanGpsTracker({ farmId, batchId }: UseArtisanGpsTrackerOptions) {
  const [capture, setCapture] = useState<OfficerGpsCaptureResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCapturedAt, setLastCapturedAt] = useState<string | null>(null);

  const accuracyTier: ArtisanGpsAccuracyTier = capture
    ? classifyArtisanGpsAccuracy(capture.accuracyM)
    : 'unknown';
  const isPoorAccuracy = accuracyTier === 'poor';

  const captureGps = useCallback(
    async (stage: ArtisanGpsActivityStage, options?: CaptureGpsOptions): Promise<OfficerGpsCaptureResult | null> => {
      setCapturing(true);
      setError(null);

      try {
        const position = await captureHighAccuracyGps();
        setCapture(position);
        setLastCapturedAt(position.timestamp);

        const productionId = options?.biocharProductionId ?? batchId ?? undefined;

        await logArtisanGps({
          farm_id: options?.farmId ?? farmId,
          biochar_production_id: productionId ?? null,
          activity_stage: stage,
          latitude: position.latitude,
          longitude: position.longitude,
          gps_accuracy: position.accuracyM,
          captured_at: position.timestamp,
          notes: options?.notes ?? null,
        });

        return position;
      } catch (captureError) {
        const message = getApiErrorMessage(captureError, 'Unable to capture GPS location.');

        setError(message);

        if (!options?.silent) {
          Alert.alert('GPS capture failed', message);
        }

        return null;
      } finally {
        setCapturing(false);
      }
    },
    [batchId, farmId],
  );

  const retryGps = useCallback(
    async (stage: ArtisanGpsActivityStage, options?: CaptureGpsOptions) => captureGps(stage, options),
    [captureGps],
  );

  return {
    capture,
    capturing,
    error,
    lastCapturedAt,
    accuracyTier,
    isPoorAccuracy,
    captureGps,
    retryGps,
    latitude: capture?.latitude ?? null,
    longitude: capture?.longitude ?? null,
    altitude: capture?.altitude ?? null,
    accuracyM: capture?.accuracyM ?? null,
    gpsCaptured: capture != null,
  };
}
