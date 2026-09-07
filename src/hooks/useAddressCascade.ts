import { useCallback, useEffect, useMemo, useState } from 'react';

import { getDistricts, getTalukas, getVillages, type AddressOption } from '../api/addressApi';
import { getApiErrorMessage } from '../api/authApi';
import { logVillageLoadDiagnostics } from '../utils/addressVillageDiagnostics';
import {
  buildGroupedVillageSelectOptions,
  resolveEntireCityOptions,
  type LocationSelectOption,
} from '../utils/workingAreaScope';

export function useAddressCascade(state = 'Gujarat') {
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [talukas, setTalukas] = useState<AddressOption[]>([]);
  const [allVillages, setAllVillages] = useState<LocationSelectOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [villageSearch, setVillageSearch] = useState('');

  const villages = useMemo(() => {
    const query = villageSearch.trim().toLowerCase();

    if (!query) {
      return allVillages;
    }

    return allVillages.filter((item) => item.name.toLowerCase().includes(query));
  }, [allVillages, villageSearch]);

  const loadDistricts = useCallback(async () => {
    setLoadingDistricts(true);
    setError(null);

    try {
      setDistricts(await getDistricts(state));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load districts.'));
    } finally {
      setLoadingDistricts(false);
    }
  }, [state]);

  const loadTalukas = useCallback(async (districtId: number) => {
    if (!districtId) {
      setTalukas([]);
      return;
    }

    setLoadingTalukas(true);
    setError(null);

    try {
      setTalukas(await getTalukas(districtId));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load talukas.'));
    } finally {
      setLoadingTalukas(false);
    }
  }, []);

  const loadVillages = useCallback(async (talukaId: number, talukaName?: string) => {
    if (!talukaId) {
      setAllVillages([]);
      return;
    }

    setLoadingVillages(true);
    setError(null);
    setVillageSearch('');

    try {
      const result = await getVillages(talukaId);
      const entireCityOptions = resolveEntireCityOptions(talukaId, talukaName, result.entireCityOptions);
      const merged = buildGroupedVillageSelectOptions(
        [talukaId],
        talukaName ? { [talukaId]: talukaName } : {},
        entireCityOptions,
        { [talukaId]: result.villages },
      );
      logVillageLoadDiagnostics({
        talukaId,
        talukaName,
        count: result.villages.length,
        entireCityOptions: entireCityOptions.length,
      });
      setAllVillages(merged);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load villages.'));
      setAllVillages([]);
    } finally {
      setLoadingVillages(false);
    }
  }, []);

  useEffect(() => {
    void loadDistricts();
  }, [loadDistricts]);

  return {
    districts,
    talukas,
    villages,
    allVillages,
    villageCount: allVillages.length,
    loadingDistricts,
    loadingTalukas,
    loadingVillages,
    error,
    villageSearch,
    setVillageSearch,
    loadDistricts,
    loadTalukas,
    loadVillages,
  };
}
