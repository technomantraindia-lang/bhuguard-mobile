import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { fieldOfficerLiveCheckIn, getFieldOfficerAllocatedLocations, getFieldOfficerCheckInStatus } from '../api/fieldOfficerApi';
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
import { getRoleDisplayName } from '../utils/roleDisplay';
import type { AuthUser } from '../types/auth';

export type MandatoryCheckInPhase = 'checkingStatus' | 'granted' | 'blocked' | 'statusError';
export type MandatoryCheckInStage = 'idle' | 'locating' | 'submitting';

const ALREADY_CHECKED_IN_PATTERN = /already checked in/i;

export interface UseFieldOfficerMandatoryCheckInResult {
  phase: MandatoryCheckInPhase;
  statusMessage: string | null;
  stage: MandatoryCheckInStage;
  submitting: boolean;
  submitError: string | null;
  roleTitle: string;
  userName: string;
  userId: string;
  assignedAreaSummary: string | null;
  checkStatus: (options?: { silent?: boolean }) => void;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [assignedAreaSummary, setAssignedAreaSummary] = useState<string | null>(null);

  const statusRequestRef = useRef(0);
  const submitLockRef = useRef(false);
  const grantedRef = useRef(false);

  useEffect(() => {
    void getAuthUser().then((authUser) => {
      setUser(authUser);
    });
  }, []);

  const checkStatus = useCallback((options?: { silent?: boolean }) => {
    const requestId = statusRequestRef.current + 1;
    statusRequestRef.current = requestId;
    const silent = options?.silent === true && grantedRef.current;

    if (!silent) {
      setPhase('checkingStatus');
      setStatusMessage(null);
    }

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
          grantedRef.current = false;
          setPhase('blocked');
        }
      } catch (error) {
        if (statusRequestRef.current !== requestId) {
          return;
        }

        // Fail closed: never grant dashboard access when status cannot be verified.
        grantedRef.current = false;
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
      if (next === 'active') {
        checkStatus({ silent: grantedRef.current });
      }
    });

    return () => subscription.remove();
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
        throw new Error('No internet connection. Reconnect and tap Retry — offline check-in is not allowed.');
      }
      if (shouldBlockOfflineTimestampSubmit(isOnline)) {
        throw new Error(
          'Cannot check in offline without a recent server time sync. Reconnect, retry time sync, and try again.',
        );
      }

      const gps = await captureHighAccuracyGps({ targetAccuracyM: 30, maxAttempts: 4, timeoutMs: 25000 });

      setStage('submitting');

      const allocated = normalizeAssignedArea(await getFieldOfficerAllocatedLocations());
      const triad = await resolveAssignedVillageForCheckIn(gps.latitude, gps.longitude, allocated);
      setAssignedAreaSummary(triad.assignedSummary);

      const payload: ApiRecord = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracyM,
        gps_accuracy: gps.accuracyM,
        village_id: triad.village_id,
        taluka_id: triad.taluka_id,
        district_id: triad.district_id,
        village_name: triad.village_name,
        taluka_name: triad.taluka_name,
        district_name: triad.district_name,
        ...buildTimeAuditMetadata('field_officer_check_in', {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyM: gps.accuracyM,
        }),
      };

      if (gps.altitude != null) {
        payload.altitude = gps.altitude;
      }

      // Server sets check_in_time authoritatively; the device never supplies it.
      await fieldOfficerLiveCheckIn(payload);

      // Re-verify server state before unlocking dashboard (no fake local grant).
      grantedRef.current = false;
      checkStatus();
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

  return useMemo(
    () => ({
      phase,
      statusMessage,
      stage,
      submitting,
      submitError,
      roleTitle: getRoleDisplayName('field_officer'),
      userName: user?.name?.trim() || 'Field Officer',
      userId: user?.id != null ? String(user.id) : '—',
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
