import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { fieldOfficerLiveCheckIn, getFieldOfficerCheckInStatus } from '../api/fieldOfficerApi';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { resolveValidatedCaptureLocation } from '../utils/livePhotoLocation';
import type { ApiRecord } from '../utils/apiHelpers';

export type MandatoryCheckInPhase = 'checkingStatus' | 'granted' | 'blocked' | 'statusError';
export type MandatoryCheckInStage = 'idle' | 'locating' | 'submitting';

const ADDRESS_RESOLVE_TIMEOUT_MS = 8000;
const ALREADY_CHECKED_IN_PATTERN = /already checked in/i;

async function resolveLocationSafely(latitude: number, longitude: number) {
  try {
    return await Promise.race([
      resolveValidatedCaptureLocation(latitude, longitude),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), ADDRESS_RESOLVE_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  }
}

export interface UseFieldOfficerMandatoryCheckInResult {
  phase: MandatoryCheckInPhase;
  statusMessage: string | null;
  stage: MandatoryCheckInStage;
  submitting: boolean;
  submitError: string | null;
  checkStatus: () => void;
  submitCheckIn: () => Promise<void>;
}

/**
 * Drives the FO mandatory duty check-in gate: verifies the active check-in
 * session with the server (never trusting device time), and submits a new
 * high-accuracy GPS check-in guarded against duplicate/multi-tap submits.
 */
export function useFieldOfficerMandatoryCheckIn(): UseFieldOfficerMandatoryCheckInResult {
  const [phase, setPhase] = useState<MandatoryCheckInPhase>('checkingStatus');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [stage, setStage] = useState<MandatoryCheckInStage>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const statusRequestRef = useRef(0);
  const submitLockRef = useRef(false);
  const grantedRef = useRef(false);

  const checkStatus = useCallback(() => {
    const requestId = statusRequestRef.current + 1;
    statusRequestRef.current = requestId;
    setPhase('checkingStatus');
    setStatusMessage(null);

    void (async () => {
      try {
        const data = (await getFieldOfficerCheckInStatus()) as ApiRecord;

        if (statusRequestRef.current !== requestId) {
          return;
        }

        const payload = (data?.check_in_status ?? data ?? {}) as ApiRecord;
        const isCheckedIn = payload.is_checked_in === true;

        if (isCheckedIn) {
          grantedRef.current = true;
          setPhase('granted');
        } else {
          setPhase('blocked');
        }
      } catch (error) {
        if (statusRequestRef.current !== requestId) {
          return;
        }

        // Fail closed: never grant dashboard access when status cannot be verified.
        setStatusMessage(
          error instanceof Error ? error.message : 'Unable to verify your check-in status. Please try again.',
        );
        setPhase('statusError');
      }
    })();
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && !grantedRef.current) {
        checkStatus();
      }
    });

    return () => subscription.remove();
  }, [checkStatus]);

  const submitCheckIn = useCallback(async () => {
    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    setStage('locating');

    try {
      const gps = await captureHighAccuracyGps({ targetAccuracyM: 30, maxAttempts: 4, timeoutMs: 25000 });

      setStage('submitting');

      const resolvedLocation = await resolveLocationSafely(gps.latitude, gps.longitude);

      const payload: ApiRecord = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracyM,
        gps_accuracy: gps.accuracyM,
      };

      if (gps.altitude != null) {
        payload.altitude = gps.altitude;
      }

      if (resolvedLocation?.resolved) {
        if (resolvedLocation.villageId) {
          payload.village_id = resolvedLocation.villageId;
        }
        if (resolvedLocation.talukaId) {
          payload.taluka_id = resolvedLocation.talukaId;
        }
        if (resolvedLocation.districtId) {
          payload.district_id = resolvedLocation.districtId;
        }
      }

      // Server sets check_in_time authoritatively; the device never supplies it.
      await fieldOfficerLiveCheckIn(payload);

      grantedRef.current = true;
      setPhase('granted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete check-in. Please try again.';

      if (ALREADY_CHECKED_IN_PATTERN.test(message)) {
        // A session already exists server-side (e.g. race from a duplicate tap) — re-verify instead of failing.
        checkStatus();
      } else {
        setSubmitError(message);
      }
    } finally {
      setStage('idle');
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }, [checkStatus]);

  return {
    phase,
    statusMessage,
    stage,
    submitting,
    submitError,
    checkStatus,
    submitCheckIn,
  };
}
