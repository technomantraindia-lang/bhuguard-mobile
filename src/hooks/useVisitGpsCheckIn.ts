import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AxiosError } from 'axios';

import { getApiErrorMessage } from '../api/authApi';
import {
  requestOutsideRadiusCheckIn,
  submitVisitCheckIn,
} from '../api/checkInApi';
import { getVisitGpsData } from '../api/fieldOfficerApi';
import { enqueueGpsCheckin, syncPendingGpsCheckins } from '../storage/visitGpsCheckinQueue';
import type { ApiRecord } from '../utils/apiHelpers';
import {
  captureHighAccuracyGps,
  getGpsPermissionStatus,
  isLocationServiceEnabled,
  requestGpsPermission,
  type GpsPermissionStatus,
  type OfficerGpsCaptureResult,
} from '../utils/officerGpsCapture';
import { MAX_ALLOWED_ACCURACY_METERS } from '../utils/locationUtils';
import {
  mapVisitGpsContext,
  verifyVisitLocation,
  type VisitGpsContext,
  type VisitLocationVerification,
} from '../utils/visitGpsVerification';
import { visitCheckInRouteContextToApiRecord, type VisitCheckInRouteContext } from '../utils/visitCheckInHelpers';

interface UseVisitGpsCheckInResult {
  loading: boolean;
  capturing: boolean;
  submitting: boolean;
  context: VisitGpsContext | null;
  capture: OfficerGpsCaptureResult | null;
  verification: VisitLocationVerification | null;
  permissionStatus: GpsPermissionStatus;
  gpsServiceEnabled: boolean | null;
  error: string | null;
  offlineSaved: boolean;
  reload: () => Promise<void>;
  refreshDeviceStatus: () => Promise<void>;
  requestPermission: () => Promise<GpsPermissionStatus>;
  captureGps: () => Promise<OfficerGpsCaptureResult | null>;
  submitCheckIn: (options?: {
    overrideReason?: string;
    overridePhotoUri?: string;
    forceOverride?: boolean;
  }) => Promise<boolean>;
  canVerifyCheckIn: boolean;
}

function formatGpsCapturedAt(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function isClientValidationError(status?: number): boolean {
  return status === 403 || status === 422;
}

function mergeVisitContext(
  apiContext: VisitGpsContext,
  routeContext?: VisitCheckInRouteContext | null,
): VisitGpsContext {
  if (!routeContext) {
    return apiContext;
  }

  const hasRouteCoords =
    routeContext.targetLatitude != null &&
    routeContext.targetLongitude != null &&
    Number.isFinite(routeContext.targetLatitude) &&
    Number.isFinite(routeContext.targetLongitude);

  if (apiContext.hasTargetCoordinates || !hasRouteCoords) {
    return apiContext;
  }

  return {
    ...apiContext,
    visitId: routeContext.visitId || apiContext.visitId,
    farmerName: routeContext.farmerOrCompanyName || apiContext.farmerName,
    farmName: routeContext.farmOrSiteName || apiContext.farmName,
    address: routeContext.address || apiContext.address,
    farmLatitude: routeContext.targetLatitude ?? apiContext.farmLatitude,
    farmLongitude: routeContext.targetLongitude ?? apiContext.farmLongitude,
    allowedRadiusMeter: routeContext.allowedRadius || apiContext.allowedRadiusMeter,
    hasTargetCoordinates: hasRouteCoords,
    assignmentStatus: routeContext.assignmentStatus || apiContext.assignmentStatus,
    checkinStatus: routeContext.checkinStatus || apiContext.checkinStatus,
  };
}

export function useVisitGpsCheckIn(
  assignmentId: number | string,
  routeContext?: VisitCheckInRouteContext | null,
): UseVisitGpsCheckInResult {
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [context, setContext] = useState<VisitGpsContext | null>(null);
  const [capture, setCapture] = useState<OfficerGpsCaptureResult | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<GpsPermissionStatus>('undetermined');
  const [gpsServiceEnabled, setGpsServiceEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);

  const verification = useMemo(() => {
    if (!capture || !context) {
      return null;
    }

    return verifyVisitLocation(capture, context);
  }, [capture, context]);

  const canVerifyCheckIn = useMemo(() => {
    if (!capture || !context || !verification) {
      return false;
    }

    if (permissionStatus !== 'granted' || gpsServiceEnabled === false) {
      return false;
    }

    if (capture.accuracyM > MAX_ALLOWED_ACCURACY_METERS) {
      return false;
    }

    if (context.needsFarmCoordinates) {
      return true;
    }

    if (!context.hasTargetCoordinates) {
      return false;
    }

    return verification.insideVisitArea;
  }, [capture, context, verification, permissionStatus, gpsServiceEnabled]);

  const refreshDeviceStatus = useCallback(async () => {
    const [permission, servicesEnabled] = await Promise.all([
      getGpsPermissionStatus(),
      isLocationServiceEnabled(),
    ]);

    setPermissionStatus(permission);
    setGpsServiceEnabled(servicesEnabled);
  }, []);

  const requestPermission = useCallback(async () => {
    const status = await requestGpsPermission();
    setPermissionStatus(status);

    return status;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await refreshDeviceStatus();

      try {
        const data = await getVisitGpsData(assignmentId);
        setContext(mergeVisitContext(mapVisitGpsContext(data as ApiRecord, Number(assignmentId)), routeContext));
      } catch (apiError) {
        if (routeContext) {
          setContext(
            mapVisitGpsContext(
              visitCheckInRouteContextToApiRecord(routeContext),
              Number(assignmentId),
            ),
          );
          setError(getApiErrorMessage(apiError, 'Using visit details from assignment. GPS target may be incomplete.'));
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      setContext(null);
      setError(getApiErrorMessage(err, 'Unable to load visit GPS data.'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId, refreshDeviceStatus, routeContext]);

  useEffect(() => {
    void reload();
    void syncPendingGpsCheckins();
  }, [reload]);

  const captureGps = useCallback(async (): Promise<OfficerGpsCaptureResult | null> => {
    setCapturing(true);
    setError(null);
    setOfflineSaved(false);

    try {
      await refreshDeviceStatus();

      if (permissionStatus !== 'granted') {
        const status = await requestPermission();

        if (status !== 'granted') {
          throw new Error('Location permission is required for GPS check-in.');
        }
      }

      const result = await captureHighAccuracyGps({ timeoutMs: 25000, maxAttempts: 4, targetAccuracyM: 25 });
      setCapture(result);

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[Bhuguard GPS] captured coordinates', result);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to capture GPS location.';
      setError(message);
      return null;
    } finally {
      setCapturing(false);
    }
  }, [permissionStatus, refreshDeviceStatus, requestPermission]);

  const submitCheckIn = useCallback(
    async (options: {
      overrideReason?: string;
      overridePhotoUri?: string;
      forceOverride?: boolean;
    } = {}): Promise<boolean> => {
      if (!capture || !context || !verification) {
        setError('Capture GPS location before saving check-in.');
        return false;
      }

      if (!context.needsFarmCoordinates && !context.hasTargetCoordinates) {
        setError('Farm/Site GPS coordinates are missing. Please contact admin.');
        return false;
      }

      if (permissionStatus !== 'granted') {
        setError('Location permission is required for field verification.');
        return false;
      }

      if (gpsServiceEnabled === false) {
        setError('Please enable location services to continue.');
        return false;
      }

      const forceOverride = Boolean(options.forceOverride);

      if (forceOverride) {
        if (!options.overrideReason?.trim()) {
          setError('Override reason is required when outside the farm radius.');
          return false;
        }
      } else if (capture.accuracyM > MAX_ALLOWED_ACCURACY_METERS) {
        setError('GPS accuracy is low. Please move to an open area and refresh location.');
        return false;
      } else if (!context.needsFarmCoordinates && !verification.insideVisitArea) {
        setError('You are outside the allowed farm/site radius.');
        return false;
      }

      const payload = {
        latitude: capture.latitude,
        longitude: capture.longitude,
        accuracy: capture.accuracyM,
        captured_at: formatGpsCapturedAt(capture.timestamp),
        distance_from_target: verification.distanceFromFarmMeter ?? 0,
        allowed_radius: context.allowedRadiusMeter,
      };

      setSubmitting(true);
      setError(null);
      setOfflineSaved(false);

      try {
        if (forceOverride) {
          await requestOutsideRadiusCheckIn(
            assignmentId,
            {
              ...payload,
              outside_radius_reason: options.overrideReason?.trim() ?? '',
            },
            options.overridePhotoUri,
          );
        } else {
          await submitVisitCheckIn(assignmentId, payload);
        }

        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.log('[Bhuguard GPS] check-in saved', payload);
        }

        return true;
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;

        if (isClientValidationError(status)) {
          setError(getApiErrorMessage(err, 'Unable to complete GPS check-in.'));
          return false;
        }

        try {
          await enqueueGpsCheckin({
            assignmentId: Number(assignmentId),
            payload: {
              ...payload,
              checkin_status: forceOverride ? 'outside_radius_pending' : 'checked_in',
              outside_radius_reason: forceOverride ? options.overrideReason?.trim() ?? null : null,
            },
            overridePhotoUri: options.overridePhotoUri,
            forceOverride,
          });
          setOfflineSaved(true);
          return true;
        } catch {
          setError(getApiErrorMessage(err, 'Unable to save GPS check-in.'));
          return false;
        }
      } finally {
        setSubmitting(false);
      }
    },
    [assignmentId, capture, context, gpsServiceEnabled, permissionStatus, verification],
  );

  return useMemo(
    () => ({
      loading,
      capturing,
      submitting,
      context,
      capture,
      verification,
      permissionStatus,
      gpsServiceEnabled,
      error,
      offlineSaved,
      reload,
      refreshDeviceStatus,
      requestPermission,
      captureGps,
      submitCheckIn,
      canVerifyCheckIn,
    }),
    [
      loading,
      capturing,
      submitting,
      context,
      capture,
      verification,
      permissionStatus,
      gpsServiceEnabled,
      error,
      offlineSaved,
      reload,
      refreshDeviceStatus,
      requestPermission,
      captureGps,
      submitCheckIn,
      canVerifyCheckIn,
    ],
  );
}
