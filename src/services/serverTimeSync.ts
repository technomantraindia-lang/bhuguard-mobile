import { apiClient } from '../api/client';

/**
 * Server-authoritative time sync.
 *
 * Bhuguard is a fraud-prevention platform — evidence/check-in/batch timestamps
 * must not be trustable purely from the device clock. This service estimates
 * the offset between the device clock and the server clock using either a
 * dedicated `/server-time` endpoint (preferred, once the backend ships it) or
 * the standard HTTP `Date` response header from any reachable endpoint
 * (fallback — works today against the live API with zero backend changes).
 *
 * The estimated offset is then used to compute a "server-synced" timestamp:
 * `deviceNow + offsetMs`. This is an approximation (± network latency), not a
 * cryptographic guarantee — the server remains the final source of truth for
 * anything security-sensitive. It exists to (a) correct obviously wrong
 * device clocks before submit and (b) warn the user when the device clock is
 * suspiciously far from the server clock.
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

type ServerTimeSyncListener = (state: ServerTimeSyncState) => void;

const SERVER_TIME_ENDPOINT = '/server-time';

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

    try {
      const response = await apiClient.get(SERVER_TIME_ENDPOINT, {
        validateStatus: () => true,
        timeout: 10000,
      });
      const requestEndMs = Date.now();

      const extracted = extractServerDateMs(response as RawHttpResponseLike);

      if (!extracted) {
        throw new Error(
          response.status >= 400
            ? `Server time is unavailable (HTTP ${response.status}).`
            : 'Server time was not present in the response.',
        );
      }

      // Correct for one-way network latency by assuming symmetric round-trip.
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
 * Callers should only invoke this immediately before a final, timestamp-critical
 * submit (e.g. Biochar batch submit) — never for routine drafts/saves.
 */
export function shouldBlockOfflineTimestampSubmit(isOnline: boolean): boolean {
  return !isOnline && !hasRecentServerTimeSync();
}
