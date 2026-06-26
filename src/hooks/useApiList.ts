import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { isApiNotFound, isNetworkError, NETWORK_ERROR_MESSAGE } from '../utils/apiError';
import type { ApiRecord } from '../utils/apiHelpers';
import { extractList } from '../utils/apiHelpers';

interface UseApiListOptions {
  fetcher: () => Promise<ApiRecord>;
  listKeys: string[];
}

export function useApiList({ fetcher, listKeys }: UseApiListOptions) {
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const fetcherRef = useRef(fetcher);
  const listKeysRef = useRef(listKeys);
  fetcherRef.current = fetcher;
  listKeysRef.current = listKeys;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    setPending(false);

    try {
      const data = await fetcherRef.current();
      setItems(extractList(data, listKeysRef.current));
    } catch (err) {
      if (isApiNotFound(err)) {
        setItems([]);
        setPending(true);
        setError(null);
      } else if (isNetworkError(err)) {
        setError(NETWORK_ERROR_MESSAGE);
      } else {
        setError(getApiErrorMessage(err, 'Failed to load data.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return {
    items,
    loading,
    refreshing,
    error,
    pending,
    reload,
    refresh,
  };
}
