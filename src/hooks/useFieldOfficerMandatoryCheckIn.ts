import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { fieldOfficerLiveCheckIn, getFieldOfficerAllocatedLocations, getFieldOfficerCheckInStatus } from '../api/fieldOfficerApi';
import {
  buildTimeAuditMetadata,
  shouldBlockOfflineTimestampSubmit,
} from '../services/serverTimeSync';
import { safeNetInfoIsConnected } from '../utils/safeNetInfo';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import {
  resolveAssignedVillageForCheckIn,
  WorkingAreaAssignmentError,
  WorkingAreaOutOfZoneError,
  type CheckInCurrentLocation,
} from '../utils/resolveAssignedVillageForCheckIn';
import { subscribeCheckInGateInvalidation } from '../utils/checkInGateEvents';
import { normalizeAssignedArea, type ApiRecord } from '../utils/apiHelpers';
import { getAuthUser } from '../utils/authStorage';
import { getRoleDisplayName } from '../utils/roleDisplay';
import { classifyAccuracyTier, MAX_ALLOWED_ACCURACY_METERS } from '../utils/locationUtils';
import type { AuthUser } from '../types/auth';
import type { AssignedLocationsPayload } from '../types/assignedLocations';

export type MandatoryCheckInPhase = 'checkingStatus' | 'granted' | 'blocked' | 'statusError';
export type MandatoryCheckInStage = 'idle' | 'locating' | 'refreshingAssignments' | 'submitting';

const ALREADY_CHECKED_IN_PATTERN = /already checked in/i;
const OUT_OF_ZONE_PATTERN = /outside your assigned|out of zone|you appear to be outside/i;

export type MandatoryCheckInSubmitError = {
  message: string;
  code?: 'OUT_OF_ZONE' | 'POOR_GPS' | 'NO_ASSIGNMENT' | 'GENERIC';
  currentLocation?: CheckInCurrentLocation | null;
  assignedSummary?: string | null;
};

export interface UseFieldOfficerMandatoryCheckInResult {
  phase: MandatoryCheckInPhase;
  statusMessage: string | null;
  stage: MandatoryCheckInStage;
  submitting: boolean;
  submitError: MandatoryCheckInSubmitError | null;
  roleTitle: string;
  userName: string;
  userId: string;
  assignedAreaSummary: string | null;
  assignedAreasDetail: AssignedLocationsPayload | null;
  checkStatus: (options?: { silent?: boolean }) => void;
  submitCheckIn: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

function toSubmitError(error: unknown): MandatoryCheckInSubmitError {
  if (error instanceof WorkingAreaOutOfZoneError) {
    return {
      message: error.message,
      code: 'OUT_OF_ZONE',
      currentLocation: error.currentLocation,
      assignedSummary: error.assignedSummary,
    };
  }

  if (error instanceof WorkingAreaAssignmentError) {
    return {
      message: error.message,
      code: 'NO_ASSIGNMENT',
    };
  }

  const message = error instanceof Error ? error.message : 'Unable to complete check-in. Please try again.';

  if (OUT_OF_ZONE_PATTERN.test(message)) {
    return {
      message: 'You appear to be outside your assigned working area.',
      code: 'OUT_OF_ZONE',
    };
  }

  return { message, code: 'GENERIC' };
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
  const [submitError, setSubmitError] = useState<MandatoryCheckInSubmitError | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [assignedAreaSummary, setAssignedAreaSummary] = useState<string | null>(null);
  const [assignedAreasDetail, setAssignedAreasDetail] = useState<AssignedLocationsPayload | null>(null);

  const statusRequestRef = useRef(0);
  const submitLockRef = useRef(false);
  const grantedRef = useRef(false);
  const assignmentRefreshLockRef = useRef(false);

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

  const refreshAssignments = useCallback(async () => {
    if (assignmentRefreshLockRef.current) {
      return;
    }

    assignmentRefreshLockRef.current = true;
    try {
      const allocated = normalizeAssignedArea(await getFieldOfficerAllocatedLocations());
      setAssignedAreasDetail(allocated);
      const villageCount = allocated.villages?.length ?? 0;
      const districtNames = (allocated.districts ?? []).map((d) => d.name).filter(Boolean);
      const talukaNames = (allocated.talukas ?? []).map((t) => t.name).filter(Boolean);
      const parts: string[] = [];
      if (districtNames.length > 0) {
        parts.push(`District: ${districtNames.slice(0, 3).join(', ')}${districtNames.length > 3 ? '…' : ''}`);
      }
      if (talukaNames.length > 0) {
        parts.push(`Taluka: ${talukaNames.slice(0, 3).join(', ')}${talukaNames.length > 3 ? '…' : ''}`);
      }
      if (villageCount > 0) {
        parts.push(`${villageCount} assigned village${villageCount === 1 ? '' : 's'}`);
      }
      setAssignedAreaSummary(parts.join(' · ') || null);
    } finally {
      assignmentRefreshLockRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (phase === 'blocked') {
      void refreshAssignments();
    }
  }, [phase, refreshAssignments]);

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

      // 1) Fresh GPS
      let gps = await captureHighAccuracyGps({ targetAccuracyM: 30, maxAttempts: 4, timeoutMs: 25000 });

      if (classifyAccuracyTier(gps.accuracyM) === 'poor' || (gps.accuracyM ?? 999) > MAX_ALLOWED_ACCURACY_METERS) {
        setSubmitError({
          code: 'POOR_GPS',
          message: `GPS accuracy is too poor (${Math.round(gps.accuracyM ?? 0)} m). Move outdoors and tap Retry GPS.`,
        });
        return;
      }

      // 2) Fresh assignments (do not rely on stale cache)
      setStage('refreshingAssignments');
      const allocated = normalizeAssignedArea(await getFieldOfficerAllocatedLocations());
      setAssignedAreasDetail(allocated);

      // 3) Resolve location once against canonical assignments
      setStage('submitting');
      let triad = await resolveAssignedVillageForCheckIn(gps.latitude, gps.longitude, allocated);
      setAssignedAreaSummary(triad.assignedSummary);

      // 4) One re-capture + re-resolve before concluding out-of-zone (handled in catch path below)
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
        locality: triad.locality,
        match_method: triad.matchMethod,
        captured_at: gps.timestamp,
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
      if (error instanceof WorkingAreaOutOfZoneError) {
        // One automatic refresh cycle: new GPS + assignments + re-resolve, then surface concise error.
        try {
          setStage('locating');
          const gps = await captureHighAccuracyGps({ targetAccuracyM: 30, maxAttempts: 3, timeoutMs: 20000 });
          if (classifyAccuracyTier(gps.accuracyM) === 'poor' || (gps.accuracyM ?? 999) > MAX_ALLOWED_ACCURACY_METERS) {
            setSubmitError({
              code: 'POOR_GPS',
              message: `GPS accuracy is too poor (${Math.round(gps.accuracyM ?? 0)} m). Move outdoors and tap Retry GPS.`,
            });
            return;
          }

          setStage('refreshingAssignments');
          const allocated = normalizeAssignedArea(await getFieldOfficerAllocatedLocations());
          setAssignedAreasDetail(allocated);

          setStage('submitting');
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
            locality: triad.locality,
            match_method: triad.matchMethod,
            captured_at: gps.timestamp,
            ...buildTimeAuditMetadata('field_officer_check_in', {
              latitude: gps.latitude,
              longitude: gps.longitude,
              accuracyM: gps.accuracyM,
            }),
          };
          if (gps.altitude != null) {
            payload.altitude = gps.altitude;
          }

          await fieldOfficerLiveCheckIn(payload);
          grantedRef.current = false;
          checkStatus();
          return;
        } catch (retryError) {
          setSubmitError(toSubmitError(retryError instanceof WorkingAreaOutOfZoneError ? retryError : error));
          return;
        }
      }

      const mapped = toSubmitError(error);
      if (ALREADY_CHECKED_IN_PATTERN.test(mapped.message)) {
        checkStatus();
      } else {
        setSubmitError(mapped);
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
      assignedAreasDetail,
      checkStatus,
      submitCheckIn,
      refreshAssignments,
    }),
    [
      phase,
      statusMessage,
      stage,
      submitting,
      submitError,
      user,
      assignedAreaSummary,
      assignedAreasDetail,
      checkStatus,
      submitCheckIn,
      refreshAssignments,
    ],
  );
}
