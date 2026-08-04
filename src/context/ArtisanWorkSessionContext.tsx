import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiErrorMessage } from '../api/authApi';
import {
  artisanWorkCheckIn,
  artisanWorkCheckOut,
  artisanWorkLiveLocation,
  getArtisanActiveCheckIn,
  getArtisanAllocatedLocations,
  getArtisanDashboard,
  type ArtisanWorkCheckInPayload,
  type ArtisanWorkLiveLocationPayload,
} from '../api/artisanApi';
import {
  enqueueArtisanWorkItem,
  flushArtisanWorkSessionQueue,
} from '../storage/artisanWorkSessionQueue';
import { loadBiocharProductionDraft } from '../storage/biocharProductionDraftStorage';
import type { ArtisanAllocatedVillage } from '../types/artisanFarmSearch';
import type { ApiRecord } from '../utils/apiHelpers';
import { calculateDistanceInMeters } from '../utils/locationUtils';
import { captureHighAccuracyGps, requestGpsPermission } from '../utils/officerGpsCapture';
import { safeNetInfoAddEventListener, safeNetInfoIsConnected } from '../utils/safeNetInfo';
import {
  buildTimeAuditMetadata,
  getServerSyncedNowIso,
  shouldBlockOfflineTimestampSubmit,
} from '../services/serverTimeSync';

export type ArtisanWorkSessionStatusKey =
  | 'not_checked_in'
  | 'getting_location'
  | 'checked_in'
  | 'location_stale'
  | 'out_of_zone'
  | 'checked_out';

export type ArtisanWorkSession = {
  id?: number | null;
  village_name?: string | null;
  taluka_name?: string | null;
  district_name?: string | null;
  village_id?: number | null;
  taluka_id?: number | null;
  district_id?: number | null;
  gps_accuracy?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  checked_in_at?: string | null;
  last_location_at?: string | null;
  duration_seconds?: number | null;
  current_activity_type?: string | null;
  is_active?: boolean;
};

type VillageTriad = {
  village_id: number;
  taluka_id: number;
  district_id: number;
  village_name: string;
  taluka_name?: string;
  district_name?: string;
};

interface ArtisanWorkSessionContextValue {
  statusKey: ArtisanWorkSessionStatusKey;
  statusLabel: string;
  session: ArtisanWorkSession | null;
  isCheckedIn: boolean;
  submitting: boolean;
  hydrating: boolean;
  error: string | null;
  gpsPreview: {
    latitude: number;
    longitude: number;
    accuracyM: number | null;
    capturedAt: string;
  } | null;
  gpsPreviewError: string | null;
  hydrate: (force?: boolean) => Promise<void>;
  refreshGpsPreview: () => Promise<void>;
  checkIn: () => Promise<boolean>;
  checkOut: () => Promise<boolean>;
  updateLiveLocation: (payload?: Partial<ArtisanWorkLiveLocationPayload>) => Promise<boolean>;
  requireCheckedIn: () => boolean;
  ensureCheckedInOrPrompt: () => boolean;
}

export const ArtisanWorkSessionContext = createContext<ArtisanWorkSessionContextValue | null>(null);

const MOVEMENT_METERS = 20;
const PERIODIC_MS = 50_000;
const CHECK_IN_DEBOUNCE_MS = 1200;
const DRAFT_PREFIX = 'bhuguard_biochar_production_draft:artisan:';

function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function namesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeName(a);
  const right = normalizeName(b);
  return left.length > 0 && right.length > 0 && left === right;
}

/** Exact normalized match, or safe contains when both sides are long enough. */
function namesLooselyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (namesMatch(a, b)) {
    return true;
  }

  const left = normalizeName(a);
  const right = normalizeName(b);
  if (left.length < 5 || right.length < 5) {
    return false;
  }

  return left.includes(right) || right.includes(left);
}

function assignedVillageNames(villages: ArtisanAllocatedVillage[]): string {
  return villages.map((village) => village.name).filter(Boolean).join(', ');
}

function buildVillageAssignmentError(
  villages: ArtisanAllocatedVillage[],
  currentVillage: string | null | undefined,
): Error {
  if (villages.length === 0) {
    return new Error(
      'No assigned area found. Please ask Admin to assign villages before check-in.',
    );
  }

  const current = (currentVillage ?? '').trim() || '—';
  const assigned = assignedVillageNames(villages) || '—';

  return new Error(
    `You are not assigned to this village. Current/Farm village: ${current}. Assigned villages: ${assigned}. Please ask Admin to add this village to your allocation.`,
  );
}

function statusLabelFor(key: ArtisanWorkSessionStatusKey): string {
  switch (key) {
    case 'getting_location':
      return 'Getting Location';
    case 'checked_in':
      return 'Checked In / Working';
    case 'location_stale':
      return 'Location Stale';
    case 'out_of_zone':
      return 'Out of Zone';
    case 'checked_out':
      return 'Checked Out';
    default:
      return 'Not Checked In';
  }
}

function parseSession(raw: unknown): ArtisanWorkSession | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return raw as ArtisanWorkSession;
}

function mapStatusKey(raw: unknown, fallback: ArtisanWorkSessionStatusKey): ArtisanWorkSessionStatusKey {
  if (typeof raw !== 'string') {
    return fallback;
  }

  switch (raw) {
    case 'not_checked_in':
    case 'getting_location':
    case 'checked_in':
    case 'location_stale':
    case 'out_of_zone':
    case 'checked_out':
      return raw;
    default:
      return fallback;
  }
}

function isOutsideZoneMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('outside your assigned') ||
    lower.includes('out of zone') ||
    lower.includes('not assigned to this village') ||
    lower.includes('no village assignment found') ||
    lower.includes('no assigned area found')
  );
}

function isNetworkFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybe = error as { message?: string; code?: string; response?: unknown };
  if (maybe.response) {
    return false;
  }

  const message = (maybe.message ?? '').toLowerCase();
  return (
    maybe.code === 'ERR_NETWORK' ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('offline')
  );
}

/**
 * Android Alert supports ~3 buttons. Page through assigned villages when GPS cannot resolve one.
 */
async function pickVillageFromAlert(
  villages: ArtisanAllocatedVillage[],
  offset = 0,
): Promise<ArtisanAllocatedVillage | null> {
  if (villages.length === 0) {
    return null;
  }

  if (villages.length === 1) {
    return villages[0] ?? null;
  }

  const remaining = villages.length - offset;
  const hasMore = remaining > 2;
  const pageSize = hasMore ? 1 : Math.min(2, remaining);
  const page = villages.slice(offset, offset + pageSize);

  return new Promise((resolve) => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'default' | 'destructive';
      onPress: () => void;
    }[] = page.map((village) => ({
      text: village.name,
      onPress: () => resolve(village),
    }));

    if (hasMore) {
      buttons.push({
        text: 'More…',
        onPress: () => {
          void pickVillageFromAlert(villages, offset + pageSize).then(resolve);
        },
      });
    }

    buttons.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => resolve(null),
    });

    Alert.alert(
      'Select assigned village',
      'Could not match GPS to an assigned village. Please choose one:',
      buttons,
    );
  });
}

function collectGeoNameCandidates(place: Location.LocationGeocodedAddress | undefined): string[] {
  if (!place) {
    return [];
  }

  const raw = [
    place.name,
    place.district,
    place.subregion,
    place.city,
    place.street,
    place.region,
    // Some platforms expose a free-form label on the placemark object.
    (place as { formattedAddress?: string }).formattedAddress,
  ];

  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const value of raw) {
    const normalized = normalizeName(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    candidates.push(value ?? '');
  }

  return candidates;
}

function matchVillagesAgainstGeoNames(
  villages: Array<ArtisanAllocatedVillage & { district_id: number }>,
  geoCandidates: string[],
  geoTaluka: string,
  geoDistrict: string,
): Array<ArtisanAllocatedVillage & { district_id: number }> {
  if (geoCandidates.length === 0) {
    return [];
  }

  const exact = villages.filter((village) =>
    geoCandidates.some((candidate) => namesMatch(village.name, candidate)),
  );

  const loose =
    exact.length > 0
      ? []
      : villages.filter((village) =>
          geoCandidates.some((candidate) => namesLooselyMatch(village.name, candidate)),
        );

  const nameMatched = exact.length > 0 ? exact : loose;

  if (nameMatched.length <= 1) {
    return nameMatched;
  }

  const withHierarchy = nameMatched.filter((village) => {
    const talukaOk =
      !village.taluka_name ||
      namesLooselyMatch(village.taluka_name, geoTaluka) ||
      geoCandidates.some((candidate) => namesLooselyMatch(village.taluka_name, candidate));
    const districtOk =
      !village.district_name ||
      namesLooselyMatch(village.district_name, geoDistrict) ||
      geoCandidates.some((candidate) => namesLooselyMatch(village.district_name, candidate));

    return talukaOk && districtOk;
  });

  return withHierarchy.length > 0 ? withHierarchy : nameMatched;
}

async function resolveFarmOrActivityVillageHint(
  villages: Array<ArtisanAllocatedVillage & { district_id: number }>,
): Promise<(ArtisanAllocatedVillage & { district_id: number }) | null> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((key) => key.startsWith(DRAFT_PREFIX));

    const hints: string[] = [];

    for (const key of draftKeys) {
      const draft = await loadBiocharProductionDraft(key);
      if (!draft) {
        continue;
      }

      for (const value of [draft.villageName, draft.talukaName, draft.districtName]) {
        const normalized = normalizeName(value);
        if (normalized) {
          hints.push(value);
        }
      }
    }

    if (hints.length === 0) {
      return null;
    }

    const exact = villages.filter((village) =>
      hints.some((hint) => namesMatch(village.name, hint)),
    );
    if (exact.length === 1) {
      return exact[0] ?? null;
    }

    const loose = villages.filter((village) =>
      hints.some((hint) => namesLooselyMatch(village.name, hint)),
    );
    if (loose.length === 1) {
      return loose[0] ?? null;
    }
  } catch {
    // Ignore storage failures; GPS / picker remain available.
  }

  return null;
}

async function resolveVillageTriad(
  latitude: number,
  longitude: number,
): Promise<VillageTriad> {
  const allocated = await getArtisanAllocatedLocations();
  const assignedVillages = Array.isArray(allocated?.villages) ? allocated.villages : [];
  const villages = assignedVillages.filter(
    (village): village is ArtisanAllocatedVillage & { district_id: number } =>
      Number.isFinite(Number(village?.district_id)) && Number(village.district_id) > 0,
  );

  if (villages.length === 0) {
    const hasArea =
      Boolean(allocated?.has_assignment) ||
      (Array.isArray(allocated?.talukas) && allocated.talukas.length > 0) ||
      (Array.isArray(allocated?.districts) && allocated.districts.length > 0);

    throw new Error(
      hasArea
        ? 'Assigned area has no villages yet. Please ask Admin to assign specific villages before check-in.'
        : 'No assigned area found. Please ask Admin to assign villages before check-in.',
    );
  }

  let placemarks: Location.LocationGeocodedAddress[] = [];

  try {
    placemarks = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch {
    placemarks = [];
  }

  const place = placemarks[0];
  const geoCandidates = collectGeoNameCandidates(place);
  const geoVillage =
    place?.district || place?.subregion || place?.city || place?.name || geoCandidates[0] || '';
  const geoTaluka = place?.subregion || place?.city || '';
  const geoDistrict = place?.region || place?.subregion || '';

  const matched = matchVillagesAgainstGeoNames(villages, geoCandidates, geoTaluka, geoDistrict);

  let chosen: (ArtisanAllocatedVillage & { district_id: number }) | null =
    matched.length === 1 ? (matched[0] ?? null) : null;

  // GPS village empty / unmatched: fall back to selected farm / activity draft village.
  if (!chosen) {
    chosen = await resolveFarmOrActivityVillageHint(villages);
  }

  if (!chosen && villages.length === 1) {
    chosen = villages[0] ?? null;
  }

  if (!chosen && matched.length > 1) {
    const pickedMatched = await pickVillageFromAlert(matched);
    if (pickedMatched && Number.isFinite(Number(pickedMatched.district_id)) && Number(pickedMatched.district_id) > 0) {
      chosen = pickedMatched as ArtisanAllocatedVillage & { district_id: number };
    }
  }

  if (!chosen) {
    const picked = await pickVillageFromAlert(villages);
    if (picked && Number.isFinite(Number(picked.district_id)) && Number(picked.district_id) > 0) {
      chosen = picked as ArtisanAllocatedVillage & { district_id: number };
    }
  }

  if (!chosen) {
    throw buildVillageAssignmentError(villages, geoVillage);
  }

  const districtId = Number(chosen.district_id);
  const talukaId = Number(chosen.taluka_id);
  const villageId = Number(chosen.id);

  if (!Number.isFinite(districtId) || !Number.isFinite(talukaId) || !Number.isFinite(villageId)) {
    throw new Error('Assigned village is missing district/taluka ids. Contact admin.');
  }

  return {
    village_id: villageId,
    taluka_id: talukaId,
    district_id: districtId,
    village_name: chosen.name,
    taluka_name: chosen.taluka_name,
    district_name: chosen.district_name,
  };
}

async function hasIncompleteLocalArtisanProduction(): Promise<boolean> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((key) => key.startsWith(DRAFT_PREFIX));

    for (const key of draftKeys) {
      const draft = await loadBiocharProductionDraft(key);
      if (draft && (draft.batchId != null || Boolean(draft.productionRecordCode))) {
        return true;
      }
    }
  } catch {
    // Ignore storage failures.
  }

  return false;
}

async function hasIncompleteBiocharProduction(): Promise<boolean> {
  if (await hasIncompleteLocalArtisanProduction()) {
    return true;
  }

  try {
    const data = await getArtisanDashboard();
    const dashboard = data?.dashboard ?? data ?? {};
    const draftCount = Number((dashboard as ApiRecord).draft_production_count ?? 0);
    return Number.isFinite(draftCount) && draftCount > 0;
  } catch {
    return false;
  }
}

function confirmIncompleteProductionCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Incomplete Biochar production',
      'You have an incomplete Biochar production session. Check out anyway?',
      [
        { text: 'Stay checked in', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Check out', style: 'destructive', onPress: () => resolve(true) },
      ],
    );
  });
}

export function ArtisanWorkSessionProvider({ children }: { children: ReactNode }) {
  const [statusKey, setStatusKey] = useState<ArtisanWorkSessionStatusKey>('not_checked_in');
  const [session, setSession] = useState<ArtisanWorkSession | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsPreview, setGpsPreview] = useState<{
    latitude: number;
    longitude: number;
    accuracyM: number | null;
    capturedAt: string;
  } | null>(null);
  const [gpsPreviewError, setGpsPreviewError] = useState<string | null>(null);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentRef = useRef<{ latitude: number; longitude: number; at: number } | null>(null);
  const checkInBusyUntilRef = useRef(0);
  const statusKeyRef = useRef(statusKey);
  const sessionRef = useRef(session);
  const submittingRef = useRef(false);
  const hydratingRef = useRef(false);
  const gpsLoadingRef = useRef(false);
  const lastHydrateAtRef = useRef(0);
  const pushLiveLocationRef = useRef<
    (
      latitude: number,
      longitude: number,
      accuracy: number | null | undefined,
      extras?: Partial<ArtisanWorkLiveLocationPayload>,
    ) => Promise<boolean>
  >(async () => false);

  statusKeyRef.current = statusKey;
  sessionRef.current = session;

  const applyStatus = useCallback((nextKey: ArtisanWorkSessionStatusKey, nextSession: ArtisanWorkSession | null) => {
    statusKeyRef.current = nextKey;
    sessionRef.current = nextSession;
    setStatusKey(nextKey);
    setSession(nextSession);
  }, []);

  const stopForegroundWatcher = useCallback(() => {
    watcherRef.current?.remove();
    watcherRef.current = null;
  }, []);

  const pushLiveLocation = useCallback(
    async (
      latitude: number,
      longitude: number,
      accuracy: number | null | undefined,
      extras?: Partial<ArtisanWorkLiveLocationPayload>,
    ): Promise<boolean> => {
      const currentSession = sessionRef.current;
      const payload: ArtisanWorkLiveLocationPayload = {
        latitude,
        longitude,
        accuracy: accuracy ?? undefined,
        gps_accuracy: accuracy ?? undefined,
        activity_stage: extras?.activity_stage ?? 'live_location_update',
        captured_at: extras?.captured_at ?? getServerSyncedNowIso(),
        farmer_id: extras?.farmer_id,
        farm_id: extras?.farm_id,
        batch_id: extras?.batch_id,
        source_screen: extras?.source_screen ?? 'foreground_watcher',
        district_id: extras?.district_id ?? currentSession?.district_id ?? undefined,
        taluka_id: extras?.taluka_id ?? currentSession?.taluka_id ?? undefined,
        village_id: extras?.village_id ?? currentSession?.village_id ?? undefined,
        village_name: extras?.village_name ?? currentSession?.village_name ?? undefined,
        district_name: extras?.district_name ?? currentSession?.district_name ?? undefined,
        taluka_name: extras?.taluka_name ?? currentSession?.taluka_name ?? undefined,
      };

      try {
        const online = await safeNetInfoIsConnected();
        if (!online) {
          await enqueueArtisanWorkItem({ kind: 'live_location', payload });
          return true;
        }

        const result = await artisanWorkLiveLocation(payload);
        const nextSession = parseSession(result.check_in);
        if (nextSession) {
          applyStatus('checked_in', nextSession);
        }
        lastSentRef.current = { latitude, longitude, at: Date.now() };
        return true;
      } catch (err) {
        const message = getApiErrorMessage(err, 'Unable to update live location.');

        if (isOutsideZoneMessage(message)) {
          applyStatus('out_of_zone', currentSession);
          setError(message);
          return false;
        }

        if (isNetworkFailure(err)) {
          await enqueueArtisanWorkItem({ kind: 'live_location', payload });
          return true;
        }

        if (message.toLowerCase().includes('please check in')) {
          applyStatus('not_checked_in', null);
          stopForegroundWatcher();
        }

        setError(message);
        return false;
      }
    },
    [applyStatus, stopForegroundWatcher],
  );

  pushLiveLocationRef.current = pushLiveLocation;

  const startForegroundWatcher = useCallback(async () => {
    stopForegroundWatcher();

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    watcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: PERIODIC_MS,
        distanceInterval: MOVEMENT_METERS,
      },
      (position) => {
        const active = statusKeyRef.current === 'checked_in' || statusKeyRef.current === 'location_stale';
        if (!active) {
          return;
        }

        const { latitude, longitude, accuracy } = position.coords;
        const last = lastSentRef.current;
        const moved =
          !last ||
          (calculateDistanceInMeters(last.latitude, last.longitude, latitude, longitude) ?? 0) >=
            MOVEMENT_METERS;
        const periodic = !last || Date.now() - last.at >= PERIODIC_MS;

        if (!moved && !periodic) {
          return;
        }

        if (
          last &&
          (calculateDistanceInMeters(last.latitude, last.longitude, latitude, longitude) ?? 999) < 5 &&
          !periodic
        ) {
          return;
        }

        void pushLiveLocationRef.current(latitude, longitude, accuracy);
      },
    );
  }, [stopForegroundWatcher]);

  const refreshGpsPreview = useCallback(async (): Promise<void> => {
    if (gpsLoadingRef.current || submittingRef.current) {
      return;
    }

    gpsLoadingRef.current = true;

    try {
      const permission = await requestGpsPermission();
      if (permission !== 'granted') {
        setGpsPreviewError('Location permission is required for check-in.');
        return;
      }

      const gps = await captureHighAccuracyGps({ maxAttempts: 2, timeoutMs: 12000 });
      setGpsPreview({
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracyM: gps.accuracyM ?? null,
        capturedAt: getServerSyncedNowIso(),
      });
      setGpsPreviewError(null);
    } catch {
      setGpsPreviewError('Unable to fetch GPS location. Please turn on location and retry.');
    } finally {
      gpsLoadingRef.current = false;
    }
  }, []);

  const hydrate = useCallback(async (force = false) => {
    if (hydratingRef.current || submittingRef.current) {
      return;
    }

    const now = Date.now();
    // Throttle AppState / NetInfo / focus re-entry storms.
    if (!force && lastHydrateAtRef.current > 0 && now - lastHydrateAtRef.current < 45_000) {
      return;
    }

    hydratingRef.current = true;
    setHydrating(true);
    setError(null);

    try {
      await flushArtisanWorkSessionQueue();
      const data = await getArtisanActiveCheckIn();
      const status = ((data as ApiRecord).check_in_status ?? data) as ApiRecord;
      const checkedIn = status.is_checked_in === true;
      const nextSession = parseSession(status.session);
      const nextKey = mapStatusKey(
        status.status_key,
        checkedIn ? 'checked_in' : 'not_checked_in',
      );

      // Never leave UI stuck on "Getting Location" from a prior interrupted check-in.
      const safeKey = nextKey === 'getting_location' ? (checkedIn ? 'checked_in' : 'not_checked_in') : nextKey;
      applyStatus(safeKey, nextSession);
      lastHydrateAtRef.current = Date.now();

      if (checkedIn && (safeKey === 'checked_in' || safeKey === 'location_stale')) {
        void startForegroundWatcher();
      } else {
        stopForegroundWatcher();
        // Do NOT auto-run GPS here — that caused endless "Getting Location" / phone slowdown.
        // GPS runs only on Refresh GPS or Check In.
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load check-in status.'));
    } finally {
      hydratingRef.current = false;
      setHydrating(false);
    }
  }, [applyStatus, startForegroundWatcher, stopForegroundWatcher]);

  const checkIn = useCallback(async (): Promise<boolean> => {
    const now = Date.now();
    if (now < checkInBusyUntilRef.current || submittingRef.current) {
      return false;
    }

    checkInBusyUntilRef.current = now + CHECK_IN_DEBOUNCE_MS;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    applyStatus('getting_location', sessionRef.current);
    let succeeded = false;

    try {
      // Fail fast if Admin has not assigned villages (resolveVillageTriad also checks).
      const allocated = await getArtisanAllocatedLocations().catch(() => null);
      if (!allocated || (allocated.villages?.length ?? 0) === 0) {
        const hasArea =
          Boolean(allocated?.has_assignment) ||
          (allocated?.talukas?.length ?? 0) > 0 ||
          (allocated?.districts?.length ?? 0) > 0;
        throw new Error(
          hasArea
            ? 'Assigned area has no villages yet. Please ask Admin to assign specific villages before check-in.'
            : 'No assigned area found. Please ask Admin to assign villages before check-in.',
        );
      }

      const permission = await requestGpsPermission();
      if (permission !== 'granted') {
        throw new Error('Location permission is required for live work check-in.');
      }

      const gps = await captureHighAccuracyGps();
      setGpsPreview({
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracyM: gps.accuracyM ?? null,
        capturedAt: getServerSyncedNowIso(),
      });
      setGpsPreviewError(null);
      const triad = await resolveVillageTriad(gps.latitude, gps.longitude);

      const isOnline = await safeNetInfoIsConnected();
      if (shouldBlockOfflineTimestampSubmit(isOnline)) {
        throw new Error(
          'Cannot check in offline without a recent server time sync. Reconnect, retry time sync, and try again.',
        );
      }

      const payload: ArtisanWorkCheckInPayload = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracyM,
        gps_accuracy: gps.accuracyM,
        district_id: triad.district_id,
        taluka_id: triad.taluka_id,
        village_id: triad.village_id,
        district_name: triad.district_name,
        taluka_name: triad.taluka_name,
        village_name: triad.village_name,
        activity_context: 'artisan_check_in',
        ...buildTimeAuditMetadata('artisan_work_session_check_in', {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyM: gps.accuracyM,
        }),
      };

      const result = await artisanWorkCheckIn(payload);
      const nextSession = parseSession(result.check_in);
      applyStatus('checked_in', nextSession);
      lastSentRef.current = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        at: Date.now(),
      };
      await startForegroundWatcher();
      succeeded = true;
      return true;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to check in.');
      const previous = sessionRef.current;

      if (isOutsideZoneMessage(message)) {
        applyStatus('out_of_zone', null);
      } else {
        applyStatus(previous?.is_active ? 'checked_in' : 'not_checked_in', previous);
      }

      setError(message);
      Alert.alert('Check-in failed', message);
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      if (!succeeded && statusKeyRef.current === 'getting_location') {
        applyStatus(sessionRef.current?.is_active ? 'checked_in' : 'not_checked_in', sessionRef.current);
      }
    }
  }, [applyStatus, startForegroundWatcher]);

  const checkOut = useCallback(async (): Promise<boolean> => {
    if (submittingRef.current) {
      return false;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    let succeeded = false;

    try {
      if (await hasIncompleteBiocharProduction()) {
        const confirmed = await confirmIncompleteProductionCheckout();
        if (!confirmed) {
          return false;
        }
      }

      applyStatus('getting_location', sessionRef.current);
      const permission = await requestGpsPermission();
      if (permission !== 'granted') {
        throw new Error('Location permission is required to check out.');
      }

      const gps = await captureHighAccuracyGps();
      const isOnlineForCheckout = await safeNetInfoIsConnected();
      if (shouldBlockOfflineTimestampSubmit(isOnlineForCheckout)) {
        throw new Error(
          'Cannot check out offline without a recent server time sync. Reconnect, retry time sync, and try again.',
        );
      }

      const payload = {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracyM,
        gps_accuracy: gps.accuracyM,
        ...buildTimeAuditMetadata('artisan_work_session_check_out', {
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracyM: gps.accuracyM,
        }),
      };

      try {
        const online = await safeNetInfoIsConnected();
        if (!online) {
          await enqueueArtisanWorkItem({ kind: 'check_out', payload });
          stopForegroundWatcher();
          applyStatus('checked_out', null);
          succeeded = true;
          return true;
        }

        const result = await artisanWorkCheckOut(payload);
        applyStatus('checked_out', parseSession(result.check_in));
        stopForegroundWatcher();
        lastSentRef.current = null;
        succeeded = true;
        return true;
      } catch (err) {
        if (isNetworkFailure(err)) {
          await enqueueArtisanWorkItem({ kind: 'check_out', payload });
          stopForegroundWatcher();
          applyStatus('checked_out', null);
          succeeded = true;
          return true;
        }
        throw err;
      }
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to check out.');
      setError(message);
      Alert.alert('Check-out failed', message);
      if (sessionRef.current?.is_active) {
        applyStatus('checked_in', sessionRef.current);
      } else {
        applyStatus('not_checked_in', sessionRef.current);
      }
      return false;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      if (!succeeded && statusKeyRef.current === 'getting_location') {
        applyStatus(sessionRef.current?.is_active ? 'checked_in' : 'not_checked_in', sessionRef.current);
      }
    }
  }, [applyStatus, stopForegroundWatcher]);

  const updateLiveLocation = useCallback(
    async (payload?: Partial<ArtisanWorkLiveLocationPayload>): Promise<boolean> => {
      try {
        const gps = await captureHighAccuracyGps({ maxAttempts: 2, timeoutMs: 15000 });
        return pushLiveLocation(gps.latitude, gps.longitude, gps.accuracyM, payload);
      } catch {
        return false;
      }
    },
    [pushLiveLocation],
  );

  const requireCheckedIn = useCallback((): boolean => statusKey === 'checked_in', [statusKey]);

  const ensureCheckedInOrPrompt = useCallback((): boolean => {
    if (requireCheckedIn()) {
      return true;
    }

    Alert.alert('Check-in required', 'Please check in before starting this activity.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Check In Now',
        onPress: () => {
          void checkIn();
        },
      },
    ]);

    return false;
  }, [checkIn, requireCheckedIn]);

  useEffect(() => {
    void hydrate(true);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        // Throttled inside hydrate() — will no-op if recently loaded.
        void hydrate(false);
      }
    };

    const subscription = AppState.addEventListener('change', onAppState);
    let unsubscribeNet: (() => void) | undefined;

    void safeNetInfoAddEventListener((connected) => {
      if (connected) {
        // Flush offline queue only; avoid full hydrate+GPS storm on flaky networks.
        void flushArtisanWorkSessionQueue();
      }
    }).then((unsubscribe) => {
      unsubscribeNet = unsubscribe;
    });

    return () => {
      subscription.remove();
      unsubscribeNet?.();
      stopForegroundWatcher();
    };
    // Mount once — hydrate identity is stable (deps are stable callbacks).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCheckedIn =
    statusKey === 'checked_in' || statusKey === 'location_stale' || statusKey === 'out_of_zone';

  const value = useMemo<ArtisanWorkSessionContextValue>(
    () => ({
      statusKey,
      statusLabel: statusLabelFor(statusKey),
      session,
      isCheckedIn,
      submitting,
      hydrating,
      error,
      gpsPreview,
      gpsPreviewError,
      hydrate,
      refreshGpsPreview,
      checkIn,
      checkOut,
      updateLiveLocation,
      requireCheckedIn,
      ensureCheckedInOrPrompt,
    }),
    [
      statusKey,
      session,
      isCheckedIn,
      submitting,
      hydrating,
      error,
      gpsPreview,
      gpsPreviewError,
      hydrate,
      refreshGpsPreview,
      checkIn,
      checkOut,
      updateLiveLocation,
      requireCheckedIn,
      ensureCheckedInOrPrompt,
    ],
  );

  return (
    <ArtisanWorkSessionContext.Provider value={value}>{children}</ArtisanWorkSessionContext.Provider>
  );
}

export function useArtisanWorkSession(): ArtisanWorkSessionContextValue {
  const value = useContext(ArtisanWorkSessionContext);

  if (!value) {
    throw new Error('useArtisanWorkSession must be used within ArtisanWorkSessionProvider.');
  }

  return value;
}
