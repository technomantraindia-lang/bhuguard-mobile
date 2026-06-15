import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerActivityLogs, getFarmerCarbonCalculations, getFarmerFarmDetail } from '../api/farmerApi';
import { buildFarmDetailViewModel, type FarmDetailViewModel } from '../utils/farmDetailModel';
import { extractList, type ApiRecord } from '../utils/apiHelpers';

export function useFarmDetailData(farmId: number) {
  const [detail, setDetail] = useState<FarmDetailViewModel | null>(null);
  const [farmRecord, setFarmRecord] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [farmData, activityData, carbonData] = await Promise.all([
        getFarmerFarmDetail(farmId),
        getFarmerActivityLogs().catch(() => ({ activity_logs: [] })),
        getFarmerCarbonCalculations().catch(() => ({ carbon_calculations: [] })),
      ]);

      const farm = (farmData.farm ?? farmData) as ApiRecord;
      const activities = extractList(activityData as ApiRecord, ['activity_logs']);
      const carbonRecords = extractList(carbonData as ApiRecord, ['carbon_calculations']);

      setFarmRecord(farm);
      setDetail(buildFarmDetailViewModel(farm, activities, carbonRecords));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farm details.'));
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    detail,
    farmRecord,
    loading,
    error,
    reload: load,
  };
}
