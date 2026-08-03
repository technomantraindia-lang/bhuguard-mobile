import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { artisanWorkCheckIn, getArtisanActiveCheckIn } from '../api/artisanApi';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { resolveValidatedCaptureLocation } from '../utils/livePhotoLocation';
import type { ApiRecord } from '../utils/apiHelpers';

export type ArtisanMandatoryCheckInPhase = 'checkingStatus' | 'granted' | 'blocked' | 'statusError';

export function useArtisanMandatoryCheckIn() {
  const [phase, setPhase] = useState<ArtisanMandatoryCheckInPhase>('checkingStatus');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const grantedRef = useRef(false);
  const requestRef = useRef(0);

  const checkStatus = useCallback(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPhase('checkingStatus');
    setStatusMessage(null);

    void (async () => {
      try {
        const data = (await getArtisanActiveCheckIn()) as ApiRecord;
        if (requestRef.current !== requestId) {
          return;
        }
        const payload = (data?.check_in_status ?? data ?? {}) as ApiRecord;
        const active =
          payload.is_checked_in === true || payload.active === true || Boolean(payload.check_in);
        if (active) {
          grantedRef.current = true;
          setPhase('granted');
        } else {
          setPhase('blocked');
        }
      } catch (error) {
        if (requestRef.current !== requestId) {
          return;
        }
        setStatusMessage(error instanceof Error ? error.message : 'Unable to verify check-in status.');
        setPhase('statusError');
      }
    })();
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && !grantedRef.current) {
        checkStatus();
      }
    });
    return () => sub.remove();
  }, [checkStatus]);

  const submitCheckIn = useCallback(async () => {
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const gps = await captureHighAccuracyGps({ targetAccuracyM: 30, maxAttempts: 4, timeoutMs: 25000 });
      const resolved = await resolveValidatedCaptureLocation(gps.latitude, gps.longitude);

      if (!resolved?.resolved || !resolved.villageId || !resolved.talukaId || !resolved.districtId) {
        throw new Error('Unable to resolve Village / Taluka / District for check-in. Retry with better GPS.');
      }

      await artisanWorkCheckIn({
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracyM,
        gps_accuracy: gps.accuracyM,
        district_id: Number(resolved.districtId),
        taluka_id: Number(resolved.talukaId),
        village_id: Number(resolved.villageId),
        district_name: resolved.district ?? null,
        taluka_name: resolved.taluka ?? null,
        village_name: resolved.village ?? null,
        state_name: resolved.state ?? null,
      });
      grantedRef.current = true;
      setPhase('granted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete check-in.';
      if (/already checked in/i.test(message)) {
        checkStatus();
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }, [checkStatus]);

  return {
    phase,
    statusMessage,
    submitting,
    submitError,
    checkStatus,
    submitCheckIn,
  };
}
