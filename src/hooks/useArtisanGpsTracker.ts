import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { logArtisanGps } from '../api/artisanApi';
import { captureHighAccuracyGps, type OfficerGpsCaptureResult } from '../utils/officerGpsCapture';
import {
  classifyArtisanGpsAccuracy,
  type ArtisanGpsAccuracyTier,
  type ArtisanGpsActivityStage,
} from '../utils/artisanGpsAccuracy';

export interface UseArtisanGpsTrackerOptions {
  farmId?: number | null;
  batchId?: number | null;
}

export interface CaptureGpsOptions {
  silent?: boolean;
  farmId?: number | null;
  biocharProductionId?: number | null;
  notes?: string | null;
}

export interface ArtisanGpsTrackerLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  accuracyM: number | null;
  altitude: number | null;
  timestamp: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
}

/**
 * On-demand Artisan Pro GPS helper for Biochar Production stages.
 * Does NOT auto-poll — capture only when captureGps / refreshGps is called.
 */
export function useArtisanGpsTracker({ farmId, batchId }: UseArtisanGpsTrackerOptions = {}) {
  const [capture, setCapture] = useState<OfficerGpsCaptureResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCapturedAt, setLastCapturedAt] = useState<string | null>(null);
  const [village, setVillage] = useState<string | null>(null);
  const [taluka, setTaluka] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  const capturingRef = useRef(false);
  const farmIdRef = useRef(farmId ?? null);
  const batchIdRef = useRef(batchId ?? null);
  farmIdRef.current = farmId ?? null;
  batchIdRef.current = batchId ?? null;

  const accuracyTier: ArtisanGpsAccuracyTier = capture
    ? classifyArtisanGpsAccuracy(capture.accuracyM)
    : 'unknown';
  const isPoorAccuracy = accuracyTier === 'poor';

  const captureGps = useCallback(
    async (
      stage: ArtisanGpsActivityStage,
      options?: CaptureGpsOptions,
    ): Promise<OfficerGpsCaptureResult | null> => {
      if (capturingRef.current) {
        return null;
      }

      capturingRef.current = true;
      setCapturing(true);
      setError(null);

      try {
        const position = await captureHighAccuracyGps();
        setCapture(position);
        setLastCapturedAt(position.timestamp);

        const productionId = options?.biocharProductionId ?? batchIdRef.current ?? undefined;
        const resolvedFarmId = options?.farmId ?? farmIdRef.current ?? undefined;

        try {
          await logArtisanGps({
            farm_id: resolvedFarmId ?? null,
            biochar_production_id: productionId ?? null,
            activity_stage: stage,
            latitude: position.latitude,
            longitude: position.longitude,
            gps_accuracy: position.accuracyM,
            captured_at: position.timestamp,
            notes: options?.notes ?? null,
          });
        } catch {
          // GPS UI should still update even if logging fails offline.
        }

        return position;
      } catch (captureError) {
        const message = getApiErrorMessage(captureError, 'Unable to capture GPS location.');
        setError(message);

        if (!options?.silent) {
          Alert.alert('GPS capture failed', message);
        }

        return null;
      } finally {
        capturingRef.current = false;
        setCapturing(false);
      }
    },
    [],
  );

  const retryGps = useCallback(
    async (stage: ArtisanGpsActivityStage, options?: CaptureGpsOptions) =>
      captureGps(stage, options),
    [captureGps],
  );

  const refreshGps = useCallback(async () => {
    return captureGps('live_location_update', { silent: false });
  }, [captureGps]);

  const startTracking = useCallback(() => {
    // Explicit opt-in flag only — no background GPS polling.
    setTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    setTracking(false);
  }, []);

  const attachStage = useCallback(
    async (
      stageName: ArtisanGpsActivityStage | string,
      metadata?: CaptureGpsOptions & {
        village?: string | null;
        taluka?: string | null;
        district?: string | null;
      },
    ) => {
      if (metadata?.village != null) {
        setVillage(metadata.village);
      }
      if (metadata?.taluka != null) {
        setTaluka(metadata.taluka);
      }
      if (metadata?.district != null) {
        setDistrict(metadata.district);
      }

      return captureGps(stageName as ArtisanGpsActivityStage, metadata);
    },
    [captureGps],
  );

  const reset = useCallback(() => {
    setCapture(null);
    setCapturing(false);
    setError(null);
    setLastCapturedAt(null);
    setVillage(null);
    setTaluka(null);
    setDistrict(null);
    setTracking(false);
    capturingRef.current = false;
  }, []);

  const location: ArtisanGpsTrackerLocation | null = capture
    ? {
        latitude: capture.latitude,
        longitude: capture.longitude,
        accuracy: capture.accuracyM ?? null,
        accuracyM: capture.accuracyM ?? null,
        altitude: capture.altitude ?? null,
        timestamp: capture.timestamp,
        village,
        taluka,
        district,
      }
    : null;

  return {
    // Primary API used by ArtisanBiocharProductionScreen
    capture,
    capturing,
    isLoading: capturing,
    error,
    lastCapturedAt,
    accuracyTier,
    isPoorAccuracy,
    captureGps,
    retryGps,
    latitude: capture?.latitude ?? null,
    longitude: capture?.longitude ?? null,
    altitude: capture?.altitude ?? null,
    accuracy: capture?.accuracyM ?? null,
    accuracyM: capture?.accuracyM ?? null,
    gpsCaptured: capture != null,
    // Extended stable API
    location,
    village,
    taluka,
    district,
    tracking,
    refreshGps,
    startTracking,
    stopTracking,
    attachStage,
    reset,
  };
}

export default useArtisanGpsTracker;
