import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerFarmActivities, getFarmerServices } from '../api/farmerApi';
import {
  FARMER_ACTIVITY_SERVICE_FALLBACK,
  type FarmerActivityServiceItem,
} from '../constants/farmerActivityServices';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { extractFarmerServicesList } from '../utils/farmerServicesHelpers';

export function useFarmerActivitiesHubData() {
  const [services, setServices] = useState<FarmerActivityServiceItem[]>(FARMER_ACTIVITY_SERVICE_FALLBACK);
  const [farmActivities, setFarmActivities] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    let servicesLoaded = false;
    let activitiesLoaded = false;

    try {
      const [servicesResult, activitiesResult] = await Promise.allSettled([
        getFarmerServices(),
        getFarmerFarmActivities(),
      ]);

      if (servicesResult.status === 'fulfilled') {
        setServices(extractFarmerServicesList(servicesResult.value as ApiRecord));
        servicesLoaded = true;
      }

      if (activitiesResult.status === 'fulfilled') {
        setFarmActivities(extractList(activitiesResult.value as ApiRecord, ['farm_activities', 'farmActivities']));
        activitiesLoaded = true;
      }

      if (!servicesLoaded && !activitiesLoaded) {
        const failure =
          servicesResult.status === 'rejected'
            ? servicesResult.reason
            : activitiesResult.status === 'rejected'
              ? activitiesResult.reason
              : new Error('Failed to load activities.');
        setError(getApiErrorMessage(failure, 'Failed to load activities.'));
      } else {
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
    farmActivities,
    loading,
    error,
    reload: load,
  };
}
