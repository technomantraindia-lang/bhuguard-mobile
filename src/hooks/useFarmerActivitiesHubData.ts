import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerFarmActivities } from '../api/farmerApi';
import { extractList, type ApiRecord } from '../utils/apiHelpers';

export function useFarmerActivitiesHubData() {
  const [farmActivities, setFarmActivities] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerFarmActivities('submitted');
      setFarmActivities(extractList(data as ApiRecord, ['farm_activities', 'farmActivities']));
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
    farmActivities,
    loading,
    error,
    reload: load,
  };
}
