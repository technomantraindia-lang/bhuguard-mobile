import { useCallback, useEffect, useMemo, useState } from 'react';

import { getFarmerFarms } from '../api/farmerApi';
import { getApiErrorMessage } from '../api/authApi';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { formatFarmerDisplayId } from '../utils/displayIds';
import {
  buildFarmSummary,
  mapFarmRecord,
  type FarmerFarmViewModel,
} from '../utils/farmMapHelpers';
import { getAuthUser } from '../utils/authStorage';

export type FarmFilterMode = 'all' | 'verified' | 'pending' | 'mapped' | 'unmapped';

export function useFarmerFarmsData() {
  const [farms, setFarms] = useState<FarmerFarmViewModel[]>([]);
  const [farmerName, setFarmerName] = useState('');
  const [farmerDisplayId, setFarmerDisplayId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FarmFilterMode>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [data, authUser] = await Promise.all([getFarmerFarms(), getAuthUser()]);
      const profileName = authUser?.name?.trim() || '';
      setFarmerName(profileName);
      const authRecord = (authUser ?? {}) as ApiRecord;
      const profile = (authRecord.farmer_profile as ApiRecord | undefined) ?? authRecord;
      setFarmerDisplayId(
        formatFarmerDisplayId({
          farmer_display_id: profile.farmer_display_id ?? authRecord.farmer_display_id,
          farmer_code: profile.farmer_code ?? authRecord.farmer_code,
        }),
      );

      const records = extractList(data as ApiRecord, ['farms']);
      setFarms(
        records
          .map(mapFarmRecord)
          .filter((farm) => farm.id > 0)
          .map((farm) => ({
            ...farm,
            farmerName: farm.farmerName || profileName,
            farmerDisplayId: farm.farmerDisplayId || formatFarmerDisplayId({
              farmer_display_id: profile.farmer_display_id ?? authRecord.farmer_display_id,
              farmer_code: profile.farmer_code ?? authRecord.farmer_code,
            }),
          })),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farms.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => buildFarmSummary(farms), [farms]);

  const filteredFarms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return farms.filter((farm) => {
      const matchesSearch =
        query.length === 0
        || farm.name.toLowerCase().includes(query)
        || farm.code.toLowerCase().includes(query)
        || farm.village.toLowerCase().includes(query)
        || farm.farmerName.toLowerCase().includes(query)
        || farm.locationLabel.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      switch (filterMode) {
        case 'verified':
          return farm.verificationBadge === 'verified';
        case 'pending':
          return farm.verificationBadge !== 'verified';
        case 'mapped':
          return farm.mappingBadge === 'mapped';
        case 'unmapped':
          return farm.mappingBadge === 'not_mapped';
        default:
          return true;
      }
    });
  }, [farms, filterMode, searchQuery]);

  const cycleFilter = () => {
    setFilterMode((current) => {
      switch (current) {
        case 'all':
          return 'verified';
        case 'verified':
          return 'pending';
        case 'pending':
          return 'mapped';
        case 'mapped':
          return 'unmapped';
        default:
          return 'all';
      }
    });
  };

  return {
    farms: filteredFarms,
    allFarms: farms,
    farmerName,
    farmerDisplayId,
    summary,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterMode,
    cycleFilter,
    reload: load,
  };
}
