import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerBiocharActivities, getFarmerServices } from '../api/farmerApi';
import {
  FARMER_ACTIVITY_SERVICE_FALLBACK,
  type FarmerActivityServiceItem,
} from '../constants/farmerActivityServices';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { extractFarmerServicesList } from '../utils/farmerServicesHelpers';

export function useFarmerActivitiesHubData() {
  const [services, setServices] = useState<FarmerActivityServiceItem[]>(FARMER_ACTIVITY_SERVICE_FALLBACK);
  const [biocharRecords, setBiocharRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let servicesLoaded = false;
    let biocharLoaded = false;

    try {
      const [servicesResult, biocharResult] = await Promise.allSettled([
        getFarmerServices(),
        getFarmerBiocharActivities(),
      ]);

      if (servicesResult.status === 'fulfilled') {
        setServices(extractFarmerServicesList(servicesResult.value as ApiRecord));
        servicesLoaded = true;
      }

      if (biocharResult.status === 'fulfilled') {
        setBiocharRecords(extractList(biocharResult.value as ApiRecord, ['batches', 'activities']));
        biocharLoaded = true;
      }

      if (!servicesLoaded && !biocharLoaded) {
        const failure =
          servicesResult.status === 'rejected'
            ? servicesResult.reason
            : biocharResult.status === 'rejected'
              ? biocharResult.reason
              : new Error('Failed to load activities.');
        setError(getApiErrorMessage(failure, 'Failed to load activities.'));
      } else if (!servicesLoaded || !biocharLoaded) {
        setError(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load activities.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    services,
    biocharRecords,
    loading,
    error,
    reload: load,
  };
}
