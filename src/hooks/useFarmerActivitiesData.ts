import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFarmerActivityLogs, getFarmerFarms, getFarmerVerificationStatus } from '../api/farmerApi';
import {
  buildActivitiesSummary,
  buildFarmNameMap,
  extractActivityLogs,
  extractVerificationAssignments,
  filterActivities,
  mapActivityRecord,
  type ActivityFilterChip,
  type FarmerActivitiesSummary,
  type FarmerActivityViewModel,
} from '../utils/farmerActivityHelpers';
import { extractList, type ApiRecord } from '../utils/apiHelpers';

export function useFarmerActivitiesData() {
  const [activities, setActivities] = useState<FarmerActivityViewModel[]>([]);
  const [summary, setSummary] = useState<FarmerActivitiesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ActivityFilterChip>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [activityData, farmsData, verificationData] = await Promise.all([
        getFarmerActivityLogs(true),
        getFarmerFarms(),
        getFarmerVerificationStatus(),
      ]);

      const farmRecords = extractList(farmsData as ApiRecord, ['farms']);
      const farmNameById = buildFarmNameMap(farmRecords);
      const verificationAssignments = extractVerificationAssignments(verificationData as ApiRecord);

      const mapped = extractActivityLogs(activityData as ApiRecord)
        .map((record) => mapActivityRecord(record, farmNameById))
        .filter((item): item is FarmerActivityViewModel => item !== null);

      const officerName =
        verificationAssignments
          .map((assignment) => {
            const name = String((assignment.field_officer as ApiRecord | undefined)?.name ?? '').trim();

            return name.length > 0 ? name : null;
          })
          .find((name) => name !== null) ?? null;

      const enriched = mapped.map((activity) => ({
        ...activity,
        fieldOfficerName: activity.fieldOfficerName ?? officerName,
      }));

      setActivities(enriched);
      setSummary(buildActivitiesSummary(enriched, verificationAssignments));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load activities.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleActivities = useMemo(
    () => filterActivities(activities, filter, searchQuery),
    [activities, filter, searchQuery],
  );

  return {
    activities: visibleActivities,
    allActivities: activities,
    summary,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    reload: load,
  };
}
