import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { artisanWorkCheckIn, getArtisanActiveCheckIn, getArtisanAllocatedLocations } from '../api/artisanApi';
import {
  buildTimeAuditMetadata,
  shouldBlockOfflineTimestampSubmit,
} from '../services/serverTimeSync';
import { safeNetInfoIsConnected } from '../utils/safeNetInfo';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { resolveAssignedVillageForCheckIn } from '../utils/resolveAssignedVillageForCheckIn';
import { subscribeCheckInGateInvalidation } from '../utils/checkInGateEvents';
import { normalizeAssignedArea, type ApiRecord } from '../utils/apiHelpers';
import { getAuthUser } from '../utils/authStorage';
import { resolveUserRole } from '../utils/authRole';
import { getRoleDisplayName } from '../utils/roleDisplay';
import { extractApiErrorMessage, logSafeApiFailure, NETWORK_UNREACHABLE_MESSAGE } from '../utils/apiError';
import type { AuthUser } from '../types/auth';

export type ArtisanMandatoryCheckInPhase = 'checkingStatus' | 'granted' | 'blocked' | 'statusError';
export type ArtisanMandatoryCheckInStage = 'idle' | 'locating' | 'submitting';

export function useArtisanMandatoryCheckIn() {
  const [phase, setPhase] = useState<ArtisanMandatoryCheckInPhase>('checkingStatus');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [stage, setStage] = useState<ArtisanMandatoryCheckInStage>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [assignedAreaSummary, setAssignedAreaSummary] = useState<string | null>(null);
  const submitLockRef = useRef(false);
  const grantedRef = useRef(false);
  const requestRef = useRef(0);

  useEffect(() => {
    void getAuthUser().then((authUser) => {
      setUser(authUser);
    });
  }, []);

  const checkStatus = useCallback((options?: { silent?: boolean }) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const silent = options?.silent === true && grantedRef.current;

    if (!silent) {
      setPhase('checkingStatus');
      setStatusMessage(null);
    }

    void (async () => {
      try {
        const data = (await getArtisanActiveCheckIn()) as ApiRecord;
        if (requestRef.current !== requestId) {
          return;
        }
        const payload = (data?.check_in_status ?? data ?? {}) as ApiRecord;
        // Fail closed: only an explicit active check-in grants dashboard access.
        const active = payload.is_checked_in === true;
        if (active) {
          grantedRef.current = true;
          setPhase('granted');
        } else {
          grantedRef.current = false;
          setPhase('blocked');
        }
      } catch (error) {
        if (requestRef.current !== requestId) {
          return;
        }
        grantedRef.current = false;
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
      if (next === 'active') {
        checkStatus({ silent: grantedRef.current });
      }
    });
    return () => sub.remove();
  }, [checkStatus]);

  useEffect(() => {
    return subscribeCheckInGateInvalidation(() => {
      grantedRef.current = false;
      checkStatus();
    });
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
      const isOnline = await safeNetInfoIsConnected();
      if (!isOnline) {
        throw new Error(NETWORK_UNREACHABLE_MESSAGE);
      }
      if (shouldBlockOfflineTimestampSubmit(isOnline)) {
        throw new Error(
          'Cannot check in offline without a recent server time sync. Reconnect, retry time sync, and try again.',
        );
      }

      const gps = await captureHighAccuracyGps({ targetAccuracyM: 30, maxAttempts: 4, timeoutMs: 25000 });
      if (
        !Number.isFinite(gps.latitude)
        || !Number.isFinite(gps.longitude)
        || gps.latitude < -90
        || gps.latitude > 90
        || gps.longitude < -180
        || gps.longitude > 180
      ) {
        throw new Error('Location could not be verified. Move outdoors and retry.');
      }

      setStage('submitting');

      const allocated = normalizeAssignedArea(await getArtisanAllocatedLocations());
      const triad = await resolveAssignedVillageForCheckIn(gps.latitude, gps.longitude, allocated);
      setAssignedAreaSummary(triad.assignedSummary);

      const payload = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracyM ?? null,
        gps_accuracy: gps.accuracyM ?? null,
        district_id: triad.district_id,
        taluka_id: triad.taluka_id,
        village_id: triad.village_id,
        district_name: triad.district_name ?? null,
        taluka_name: triad.taluka_name ?? null,
        village_name: triad.village_name ?? null,
        state_name: triad.state_name ?? null,
        activity_context: 'artisan_check_in',
        ...buildTimeAuditMetadata('artisan_check_in', {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyM: gps.accuracyM,
        }),
      };

      if (__DEV__) {
        console.log('[Artisan check-in] submitting', {
          endpoint: 'POST /artisan/check-in',
          district_id: payload.district_id,
          taluka_id: payload.taluka_id,
          village_id: payload.village_id,
          has_accuracy: payload.accuracy != null,
          has_coords: Number.isFinite(payload.latitude) && Number.isFinite(payload.longitude),
        });
      }

      await artisanWorkCheckIn(payload);

      setSubmitError(null);
      grantedRef.current = false;
      checkStatus();
    } catch (error) {
      logSafeApiFailure(error, 'artisan_mandatory_check_in');
      const message = extractApiErrorMessage(error, 'Check-in could not be completed. Please try again.');
      if (/already checked in|active work session|active check-in resumed/i.test(message)) {
        setSubmitError(null);
        checkStatus();
      } else {
        setSubmitError(message);
        setPhase('blocked');
      }
    } finally {
      setStage('idle');
      setSubmitting(false);
      submitLockRef.current = false;
    }
  }, [checkStatus]);

  return useMemo(
    () => ({
      phase,
      statusMessage,
      stage,
      submitting,
      submitError,
      roleTitle: getRoleDisplayName(resolveUserRole(user) ?? user?.user_type ?? 'artisan'),
      userName: user?.name?.trim() || user?.artisan_profile?.name?.trim() || getRoleDisplayName(resolveUserRole(user) ?? user?.user_type ?? 'artisan'),
      userId:
        user?.artisan_profile?.artisan_code != null
          ? String(user.artisan_profile.artisan_code)
          : user?.id != null
            ? String(user.id)
            : '—',
      assignedAreaSummary,
      checkStatus,
      submitCheckIn,
    }),
    [
      phase,
      statusMessage,
      stage,
      submitting,
      submitError,
      user,
      assignedAreaSummary,
      checkStatus,
      submitCheckIn,
    ],
  );
}
