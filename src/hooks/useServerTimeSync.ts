import { useCallback, useEffect, useState } from 'react';

import {
  getServerTimeSyncState,
  subscribeServerTimeSync,
  syncServerTime,
  isClockSkewSuspicious,
  hasRecentServerTimeSync,
  type ServerTimeSyncState,
} from '../services/serverTimeSync';

export interface UseServerTimeSyncResult extends ServerTimeSyncState {
  isSuspiciousSkew: boolean;
  hasRecentSync: boolean;
  retrySync: () => Promise<void>;
}

/**
 * Reactive wrapper around the server time sync service. Triggers a
 * (throttled) sync on mount and re-renders when the shared state changes.
 */
export function useServerTimeSync(options?: { autoSync?: boolean }): UseServerTimeSyncResult {
  const autoSync = options?.autoSync !== false;
  const [state, setState] = useState<ServerTimeSyncState>(() => getServerTimeSyncState());

  useEffect(() => subscribeServerTimeSync(setState), []);

  useEffect(() => {
    if (autoSync) {
      void syncServerTime();
    }
  }, [autoSync]);

  const retrySync = useCallback(async () => {
    await syncServerTime({ force: true });
  }, []);

  return {
    ...state,
    isSuspiciousSkew: isClockSkewSuspicious(),
    hasRecentSync: hasRecentServerTimeSync(),
    retrySync,
    syncing: state.syncing,
  };
}
