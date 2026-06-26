import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerServices } from '../api/farmerApi';
import {
  FARMER_ACTIVITY_SERVICE_FALLBACK,
  type FarmerActivityServiceItem,
} from '../constants/farmerActivityServices';
import type { ApiRecord } from '../utils/apiHelpers';
import { extractFarmerServicesList } from '../utils/farmerServicesHelpers';

export function useFarmerServicesScreenData() {
  const [services, setServices] = useState<FarmerActivityServiceItem[]>(FARMER_ACTIVITY_SERVICE_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = (await getFarmerServices()) as ApiRecord;
      const nextServices = extractFarmerServicesList(data);

      if (mountedRef.current) {
        setServices(nextServices);
      }
    } catch (err) {
      if (mountedRef.current) {
        setServices(FARMER_ACTIVITY_SERVICE_FALLBACK);
        setError(getApiErrorMessage(err, 'Unable to load services. Showing default list.'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return {
    services,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  };
}
