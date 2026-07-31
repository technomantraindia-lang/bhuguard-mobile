import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { getArtisanAllocatedLocations, getArtisanDashboard } from '../api/artisanApi';
import { getFieldOfficerAllocatedLocations } from '../api/fieldOfficerApi';
import type { AssignedLocationsPayload } from '../types/assignedLocations';
import { defaultAssignedArea, normalizeAssignedArea } from '../utils/apiHelpers';
import { sanitizeAssignmentError } from '../utils/assignmentErrorMessage';
import { getAuthUser, getAuthUserType } from '../utils/authStorage';

type AssignedRole = 'field_officer' | 'artisan' | 'auto';

const EMPTY_LOCATIONS: AssignedLocationsPayload = {
  ...defaultAssignedArea,
  districts: [],
  talukas: [],
  villages: [],
};

const APP_RESUME_MIN_MS = 60_000;

function isArtisanUserType(value: string | null | undefined): boolean {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return normalized === 'artisan' || normalized === 'artisan_pro';
}

function hasLocationSignal(payload: AssignedLocationsPayload | null | undefined): boolean {
  if (!payload) {
    return false;
  }

  return (
    payload.has_assignment === true ||
    (payload.villages?.length ?? 0) > 0 ||
    (payload.talukas?.length ?? 0) > 0 ||
    (payload.districts?.length ?? 0) > 0
  );
}

async function resolveAssignedRole(requested: AssignedRole): Promise<'field_officer' | 'artisan'> {
  if (requested === 'artisan' || requested === 'field_officer') {
    return requested;
  }

  const storedType = await getAuthUserType();
  if (isArtisanUserType(storedType)) {
    return 'artisan';
  }

  const user = await getAuthUser();
  if (isArtisanUserType(user?.user_type) || isArtisanUserType(user?.role) || isArtisanUserType(user?.type)) {
    return 'artisan';
  }

  if (user?.artisan_profile?.id || user?.artisan?.id) {
    return 'artisan';
  }

  return 'field_officer';
}

/**
 * Loads Admin-assigned working areas for Field Officer or Artisan Pro.
 * Use role `auto` on shared onboarding/farm-activity screens so Artisan Pro
 * reads `/artisan/allocated-locations` instead of requiring a Field Officer link.
 */
export function useAssignedLocations(role: AssignedRole = 'auto') {
  const [locations, setLocations] = useState<AssignedLocationsPayload>(EMPTY_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedRole, setResolvedRole] = useState<'field_officer' | 'artisan' | null>(null);
  const [linkedFieldOfficer, setLinkedFieldOfficer] = useState<{ id: number | null; name: string | null } | null>(
    null,
  );
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const lastLoadAtRef = useRef(0);

  const load = useCallback(async (force = false) => {
    if (loadingRef.current) {
      return;
    }

    const now = Date.now();
    if (!force && lastLoadAtRef.current > 0 && now - lastLoadAtRef.current < APP_RESUME_MIN_MS) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const effectiveRole = await resolveAssignedRole(role);
      if (mountedRef.current) {
        setResolvedRole(effectiveRole);
      }

      let data: AssignedLocationsPayload = EMPTY_LOCATIONS;
      let linked: { id: number | null; name: string | null } | null = null;

      if (effectiveRole === 'artisan') {
        const allocated = await getArtisanAllocatedLocations();
        data = normalizeAssignedArea(allocated);

        // Fallback: dashboard assigned_area when allocated-locations is empty/stale.
        if (!hasLocationSignal(data)) {
          try {
            const dashboardResult = await getArtisanDashboard();
            const fromDashboard = normalizeAssignedArea(dashboardResult.dashboard ?? {});
            if (hasLocationSignal(fromDashboard)) {
              data = fromDashboard;
            }
          } catch {
            // Keep allocated payload.
          }
        }

        const raw = allocated as AssignedLocationsPayload & {
          linked_field_officer?: { id?: number | null; name?: string | null };
          linkedFieldOfficer?: { id?: number | null; name?: string | null };
        };
        const link = raw.linked_field_officer ?? raw.linkedFieldOfficer;
        if (link && typeof link === 'object') {
          linked = {
            id: link.id != null && Number.isFinite(Number(link.id)) ? Number(link.id) : null,
            name: typeof link.name === 'string' ? link.name : null,
          };
        }
      } else {
        data = normalizeAssignedArea(await getFieldOfficerAllocatedLocations());
      }

      if (!mountedRef.current) {
        return;
      }

      const payload = normalizeAssignedArea(data ?? EMPTY_LOCATIONS);
      setLocations(payload);
      setLinkedFieldOfficer(linked);
      lastLoadAtRef.current = Date.now();

      if (!hasLocationSignal(payload)) {
        setError('No assigned working area found. Please ask Admin to assign villages.');
      } else {
        setError(null);
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      // Keep last good assignments; do not wipe UI to empty on transient errors.
      setError(
        sanitizeAssignmentError(
          getApiErrorMessage(err, 'Unable to load assigned locations. Please try again.'),
        ),
      );
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [role]);

  useEffect(() => {
    mountedRef.current = true;
    void load(true);

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        void load(false);
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => subscription.remove();
  }, [load]);

  const hasAssignment = hasLocationSignal(locations);

  const refresh = useCallback(async () => {
    lastLoadAtRef.current = 0;
    await load(true);
  }, [load]);

  return {
    locations: locations ?? EMPTY_LOCATIONS,
    hasAssignment,
    loading,
    error,
    refresh,
    resolvedRole,
    linkedFieldOfficer,
  };
}
