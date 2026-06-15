import { useCallback, useEffect, useMemo, useState } from 'react';

import { getFarmerFarms } from '../api/farmerApi';
import { getApiErrorMessage } from '../api/authApi';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import {
  buildFarmSummary,
  mapFarmRecord,
  type FarmerFarmViewModel,
} from '../utils/farmMapHelpers';

export type FarmFilterMode = 'all' | 'verified' | 'pending' | 'mapped' | 'unmapped';

export function useFarmerFarmsData() {
  const [farms, setFarms] = useState<FarmerFarmViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FarmFilterMode>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerFarms();
      const records = extractList(data as ApiRecord, ['farms']);
      setFarms(records.map(mapFarmRecord).filter((farm) => farm.id > 0));
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
        query.length === 0 ||
        farm.name.toLowerCase().includes(query) ||
        farm.code.toLowerCase().includes(query) ||
        farm.village.toLowerCase().includes(query) ||
        farm.locationLabel.toLowerCase().includes(query);

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
