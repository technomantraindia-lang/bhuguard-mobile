import { apiClient } from '../api/client';
import {
  SERVER_TIME_ENDPOINT_CANDIDATES,
  SERVER_TIME_ENDPOINT_PATH,
} from '../config/serverTimeEndpoints';
import { appendTimeAuditRecord } from '../storage/timeAuditStorage';
import { getAuthUser } from '../utils/authStorage';

/**
 * Server-authoritative time sync.
 *
 * Bhuguard is a fraud-prevention platform — evidence/check-in/batch timestamps
 * must not be trustable purely from the device clock. This service estimates
 * the offset between the device clock and the server clock using either a
 * dedicated `/server-time` endpoint (preferred) or the standard HTTP `Date`
 * response header from a lightweight fallback probe.
 *
 * The estimated offset is then used to compute a "server-synced" timestamp:
 * `deviceNow + offsetMs`. This is an approximation (± network latency), not a
 * cryptographic guarantee — the server remains the final source of truth for
 * anything security-sensitive.
 */

export type ServerTimeSyncSource = 'endpoint' | 'header';

export interface ServerTimeSyncState {
  /** serverTimeMs - deviceTimeMs, estimated at the moment of the last successful sync. */
  offsetMs: number | null;
  /** Device Date.now() at the moment the last successful sync completed. */
  lastSyncedAtDeviceMs: number | null;
  /** Server clock ISO string observed during the last successful sync. */
  lastSyncedServerIso: string | null;
  source: ServerTimeSyncSource | null;
  syncing: boolean;
  error: string | null;
}

export interface TimeAuditMetadata {
  device_utc: string;
  server_utc: string;
  clock_skew_ms: number | null;
  device_time_suspicious: boolean;
  time_sync_source: ServerTimeSyncSource | null;
  time_detection_at: string;
  activity_context: string;
  user_id?: number | null;
  user_role?: string | null;
}

type ServerTimeSyncListener = (state: ServerTimeSyncState) => void;

/** Device vs. server clock gap beyond this is flagged as suspicious. */
export const MAX_ACCEPTABLE_SKEW_MS = 2 * 60 * 1000;

/** A sync older than this is no longer considered "recent" for offline submit gating. */
export const RECENT_SYNC_MAX_AGE_MS = 30 * 60 * 1000;

/** Avoid hammering the server — reuse a recent successful sync unless forced. */
const THROTTLE_MS = 3 * 60 * 1000;

let state: ServerTimeSyncState = {
  offsetMs: null,
  lastSyncedAtDeviceMs: null,
  lastSyncedServerIso: null,
  source: null,
  syncing: false,
  error: null,
};

const listeners = new Set<ServerTimeSyncListener>();

function notify(): void {
  const snapshot = { ...state };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // Never let a bad subscriber break the sync pipeline.
    }
  });
}

export function subscribeServerTimeSync(listener: ServerTimeSyncListener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export function getServerTimeSyncState(): ServerTimeSyncState {
  return { ...state };
}

interface RawHttpResponseLike {
  status: number;
  data?: unknown;
  headers?: Record<string, unknown>;
}

function extractServerDateMs(response: RawHttpResponseLike): { ms: number; source: ServerTimeSyncSource } | null {
  const rawBody = response.data;
  const envelope =
    rawBody && typeof rawBody === 'object' && 'data' in (rawBody as Record<string, unknown>)
      ? (rawBody as { data?: unknown }).data
      : rawBody;
  const payload = envelope && typeof envelope === 'object' ? (envelope as Record<string, unknown>) : undefined;

  const candidateIso =
    (payload?.server_time as string | undefined) ??
    (payload?.serverTime as string | undefined) ??
    (payload?.now as string | undefined) ??
    (payload?.time as string | undefined) ??
    (payload?.utc as string | undefined);

  if (typeof candidateIso === 'string' && candidateIso.trim()) {
    const ms = Date.parse(candidateIso);
    if (Number.isFinite(ms)) {
      return { ms, source: 'endpoint' };
    }
  }

  const headers = response.headers ?? {};
  const dateHeader = (headers.date as string | undefined) ?? (headers.Date as string | undefined);

  if (typeof dateHeader === 'string' && dateHeader.trim()) {
    const ms = Date.parse(dateHeader);
    if (Number.isFinite(ms)) {
      return { ms, source: 'header' };
    }
  }

  return null;
}

let inFlight: Promise<ServerTimeSyncState> | null = null;

/**
 * Sync the device/server clock offset. Safe to call repeatedly — throttled
 * unless `force` is passed (e.g. user tapped "Retry Sync").
 */
export async function syncServerTime(options?: { force?: boolean }): Promise<ServerTimeSyncState> {
  const force = options?.force === true;

  if (
    !force &&
    state.offsetMs != null &&
    state.lastSyncedAtDeviceMs != null &&
    Date.now() - state.lastSyncedAtDeviceMs < THROTTLE_MS
  ) {
    return { ...state };
  }

  if (inFlight) {
    return inFlight;
  }

  state = { ...state, syncing: true, error: null };
  notify();

  inFlight = (async () => {
    const requestStartMs = Date.now();
    let lastError: string | null = null;

    try {
      for (const path of SERVER_TIME_ENDPOINT_CANDIDATES) {
        try {
          const response = await apiClient.get(path, {
            validateStatus: () => true,
            timeout: 10000,
          });
          const requestEndMs = Date.now();
          const extracted = extractServerDateMs(response as RawHttpResponseLike);

          if (!extracted) {
            lastError =
              response.status >= 400
                ? `Server time is unavailable (HTTP ${response.status}) at ${path}.`
                : `Server time was not present in the response from ${path}.`;
            // Prefer continuing to fallback probe rather than failing hard on 404.
            if (path === SERVER_TIME_ENDPOINT_PATH) {
              continue;
            }
            throw new Error(lastError);
          }

          const roundTripMs = Math.max(0, requestEndMs - requestStartMs);
          const estimatedServerNowAtReceiveMs = extracted.ms + roundTripMs / 2;
          const offsetMs = estimatedServerNowAtReceiveMs - requestEndMs;

          state = {
            offsetMs,
            lastSyncedAtDeviceMs: requestEndMs,
            lastSyncedServerIso: new Date(extracted.ms).toISOString(),
            source: extracted.source,
            syncing: false,
            error: null,
          };
          lastError = null;
          break;
        } catch (probeError) {
          lastError = probeError instanceof Error ? probeError.message : 'Unable to sync server time.';
        }
      }

      if (state.offsetMs == null && lastError) {
        state = {
          ...state,
          syncing: false,
          error: lastError,
        };
      } else if (state.syncing) {
        state = { ...state, syncing: false };
      }
    } catch (error) {
      state = {
        ...state,
        syncing: false,
        error: error instanceof Error ? error.message : 'Unable to sync server time.',
      };
    } finally {
      notify();
      inFlight = null;
    }

    return { ...state };
  })();

  return inFlight;
}

/** Estimated serverTimeMs - deviceTimeMs from the last successful sync, or null if never synced. */
export function getClockSkewMs(): number | null {
  return state.offsetMs;
}

/** True when the device clock is more than the acceptable threshold away from server time. */
export function isClockSkewSuspicious(thresholdMs: number = MAX_ACCEPTABLE_SKEW_MS): boolean {
  return state.offsetMs != null && Math.abs(state.offsetMs) > thresholdMs;
}

/** True when we have an offset from within the last `maxAgeMs` (default 30 min). */
export function hasRecentServerTimeSync(maxAgeMs: number = RECENT_SYNC_MAX_AGE_MS): boolean {
  return state.lastSyncedAtDeviceMs != null && Date.now() - state.lastSyncedAtDeviceMs < maxAgeMs;
}

/** Convert a device epoch (defaults to now) into a server-corrected epoch using the last known offset. */
export function getServerSyncedEpochMs(deviceEpochMs: number = Date.now()): number {
  return state.offsetMs != null ? deviceEpochMs + state.offsetMs : deviceEpochMs;
}

export function getServerSyncedNow(): Date {
  return new Date(getServerSyncedEpochMs());
}

export function getServerSyncedNowIso(): string {
  return getServerSyncedNow().toISOString();
}

/**
 * Block a timestamp-sensitive final submit when the device is offline and we
 * have no recent server-time confirmation to trust the device clock against.
 */
export function shouldBlockOfflineTimestampSubmit(isOnline: boolean): boolean {
  return !isOnline && !hasRecentServerTimeSync();
}

/**
 * Audit metadata for timestamp-sensitive submits (Phase 19).
 * Device wall-clock is recorded only for audit — never as authoritative time.
 * Entries are also persisted locally for later review/support.
 * GPS extras are stored in the local audit log only (not returned) so callers
 * can safely spread this object into API payloads without clobbering lat/long.
 */
export function buildTimeAuditMetadata(
  activityContext: string,
  extras?: {
    latitude?: number | null;
    longitude?: number | null;
    accuracyM?: number | null;
    userId?: number | null;
    userRole?: string | null;
  },
): TimeAuditMetadata {
  const deviceEpoch = Date.now();
  const deviceUtc = new Date(deviceEpoch).toISOString();
  const serverUtc = getServerSyncedNowIso();
  const metadata: TimeAuditMetadata = {
    device_utc: deviceUtc,
    server_utc: serverUtc,
    clock_skew_ms: getClockSkewMs(),
    device_time_suspicious: isClockSkewSuspicious(),
    time_sync_source: state.source,
    time_detection_at: serverUtc,
    activity_context: activityContext,
    user_id: extras?.userId ?? null,
    user_role: extras?.userRole ?? null,
  };

  void (async () => {
    try {
      const user = extras?.userId != null ? null : await getAuthUser();
      await appendTimeAuditRecord({
        ...metadata,
        user_id: metadata.user_id ?? user?.id ?? null,
        user_role: metadata.user_role ?? user?.user_type ?? user?.role ?? null,
        latitude: extras?.latitude ?? null,
        longitude: extras?.longitude ?? null,
        accuracy_m: extras?.accuracyM ?? null,
      });
    } catch {
      // Persistence is best-effort.
    }
  })();

  return metadata;
}
