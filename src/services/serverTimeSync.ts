import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '../api/client';

const STORAGE_KEY = '@bhuguard/server_time_sync_v1';
const SUSPICIOUS_MS = 2 * 60 * 1000;
const FRESH_SYNC_MS = 15 * 60 * 1000;

export type ServerTimeSyncState = {
  serverUtcMs: number;
  deviceUtcMs: number;
  monotonicMs: number;
  offsetMs: number;
  differenceMs: number;
  device_time_suspicious: boolean;
  syncedAtDeviceMs: number;
};

let memoryState: ServerTimeSyncState | null = null;
let syncInFlight: Promise<ServerTimeSyncState | null> | null = null;

function nowDeviceUtcMs(): number {
  return Date.now();
}

function nowMonotonicMs(): number {
  // performance.now is monotonic when available.
  const perf = globalThis.performance;
  if (perf && typeof perf.now === 'function') {
    return perf.now();
  }
  return Date.now();
}

export function getServerTimeSyncState(): ServerTimeSyncState | null {
  return memoryState;
}

export function isDeviceTimeSuspicious(): boolean {
  return Boolean(memoryState?.device_time_suspicious);
}

export function hasFreshServerTimeSync(): boolean {
  if (!memoryState) {
    return false;
  }
  return nowDeviceUtcMs() - memoryState.syncedAtDeviceMs <= FRESH_SYNC_MS;
}

/** Authoritative approximate server UTC using last sync offset + monotonic drift. */
export function getSynchronizedServerUtcMs(): number | null {
  if (!memoryState) {
    return null;
  }
  const elapsed = nowMonotonicMs() - memoryState.monotonicMs;
  return memoryState.serverUtcMs + elapsed;
}

export function getSynchronizedServerDate(): Date | null {
  const ms = getSynchronizedServerUtcMs();
  return ms == null ? null : new Date(ms);
}

async function persist(state: ServerTimeSyncState): Promise<void> {
  memoryState = state;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Non-fatal.
  }
}

export async function loadPersistedServerTimeSync(): Promise<ServerTimeSyncState | null> {
  if (memoryState) {
    return memoryState;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ServerTimeSyncState;
    memoryState = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function stateFromServerUtc(serverUtcMs: number): ServerTimeSyncState {
  const deviceUtcMs = nowDeviceUtcMs();
  const differenceMs = deviceUtcMs - serverUtcMs;
  return {
    serverUtcMs,
    deviceUtcMs,
    monotonicMs: nowMonotonicMs(),
    offsetMs: serverUtcMs - deviceUtcMs,
    differenceMs,
    device_time_suspicious: Math.abs(differenceMs) > SUSPICIOUS_MS,
    syncedAtDeviceMs: deviceUtcMs,
  };
}

/**
 * Sync server UTC from Date header and/or /server-time.
 * Never treats timezone alone as suspicious — compares UTC epochs.
 */
export async function syncServerTime(): Promise<ServerTimeSyncState | null> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = (async () => {
    try {
      let serverUtcMs: number | null = null;

      try {
        const response = await apiClient.get('/server-time');
        const data = response.data?.data ?? response.data;
        if (data?.unix != null) {
          serverUtcMs = Number(data.unix) * 1000;
        } else if (typeof data?.server_utc === 'string') {
          const parsed = Date.parse(data.server_utc);
          if (Number.isFinite(parsed)) {
            serverUtcMs = parsed;
          }
        }
        const headerDate = response.headers?.date ?? response.headers?.Date;
        if (serverUtcMs == null && typeof headerDate === 'string') {
          const parsed = Date.parse(headerDate);
          if (Number.isFinite(parsed)) {
            serverUtcMs = parsed;
          }
        }
      } catch {
        // Fallback: lightweight HEAD/GET on API root for Date header.
        try {
          const response = await apiClient.get('/');
          const headerDate = response.headers?.date ?? response.headers?.Date;
          if (typeof headerDate === 'string') {
            const parsed = Date.parse(headerDate);
            if (Number.isFinite(parsed)) {
              serverUtcMs = parsed;
            }
          }
        } catch {
          return memoryState;
        }
      }

      if (serverUtcMs == null || !Number.isFinite(serverUtcMs)) {
        return memoryState;
      }

      const next = stateFromServerUtc(serverUtcMs);
      await persist(next);
      return next;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

export function buildDeviceTimeAuditMetadata(activityContext: string): Record<string, unknown> {
  const state = memoryState;
  return {
    device_utc: new Date(nowDeviceUtcMs()).toISOString(),
    server_utc: state ? new Date(state.serverUtcMs).toISOString() : null,
    difference_ms: state?.differenceMs ?? null,
    detection_time: new Date().toISOString(),
    activity_context: activityContext,
    device_time_suspicious: Boolean(state?.device_time_suspicious),
  };
}
