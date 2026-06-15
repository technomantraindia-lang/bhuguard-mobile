import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { isApiNotFound, isNetworkError, NETWORK_ERROR_MESSAGE, PENDING_API_MESSAGE } from '../utils/apiError';
import type { ApiRecord } from '../utils/apiHelpers';

export function useApiDetail(fetcher: () => Promise<ApiRecord>) {
  const [data, setData] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPending(false);

    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      if (isApiNotFound(err)) {
        setData(null);
        setPending(true);
        setError(null);
      } else if (isNetworkError(err)) {
        setError(NETWORK_ERROR_MESSAGE);
      } else {
        setError(getApiErrorMessage(err, 'Failed to load data.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, pending, reload: load };
}
