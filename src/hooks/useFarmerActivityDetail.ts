import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerActivityLogDetail, getFarmerFarms } from '../api/farmerApi';
import {
  buildFarmNameMap,
  mapActivityRecord,
  type FarmerActivityViewModel,
} from '../utils/farmerActivityHelpers';
import { extractList, type ApiRecord } from '../utils/apiHelpers';

export function useFarmerActivityDetail(activityId: number) {
  const [activity, setActivity] = useState<FarmerActivityViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [detailData, farmsData] = await Promise.all([
        getFarmerActivityLogDetail(activityId),
        getFarmerFarms(),
      ]);

      const record = (detailData.activity_log ?? detailData) as ApiRecord;
      const farms = extractList(farmsData as ApiRecord, ['farms']);
      const farmNameById = buildFarmNameMap(farms);
      const mapped = mapActivityRecord(record, farmNameById);

      if (!mapped) {
        setError('Activity details are unavailable.');
        setActivity(null);
        return;
      }

      setActivity(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load activity details.'));
      setActivity(null);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { activity, loading, error, reload: load };
}
