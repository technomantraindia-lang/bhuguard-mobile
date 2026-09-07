import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getVillagesForTalukas, type AddressOption } from '../api/addressApi';
import { getApiErrorMessage } from '../api/authApi';
import { logVillageLoadDiagnostics } from '../utils/addressVillageDiagnostics';
import {
  type EntireCityOption,
  buildGroupedVillageSelectOptions,
  type LocationSelectOption,
} from '../utils/workingAreaScope';

export function useTalukaVillageOptions(talukaIds: number[], talukaNames: Record<number, string> = {}) {
  const [villagesByTaluka, setVillagesByTaluka] = useState<Record<number, AddressOption[]>>({});
  const [entireCityOptions, setEntireCityOptions] = useState<EntireCityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const talukaNamesRef = useRef(talukaNames);
  talukaNamesRef.current = talukaNames;

  const normalizedTalukaIds = useMemo(
    () => Array.from(new Set(talukaIds.map((id) => Number(id)).filter((id) => id > 0))).sort((a, b) => a - b),
    [talukaIds],
  );

  const orderedTalukaIds = useMemo(
    () => talukaIds.map((id) => Number(id)).filter((id) => id > 0),
    [talukaIds],
  );

  const load = useCallback(async () => {
    if (normalizedTalukaIds.length === 0) {
      setVillagesByTaluka({});
      setEntireCityOptions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getVillagesForTalukas(normalizedTalukaIds);

      normalizedTalukaIds.forEach((talukaId) => {
        const count = result.villages.filter((village) => {
          const villageTalukaId = Number((village as AddressOption & { taluka_id?: number }).taluka_id ?? talukaId);
          return villageTalukaId === talukaId;
        }).length;

        logVillageLoadDiagnostics({
          talukaId,
          talukaName: talukaNamesRef.current[talukaId],
          count,
          entireCityOptions: result.entireCityOptions.filter((option) => option.taluka_id === talukaId).length,
        });
      });

      const grouped: Record<number, AddressOption[]> = {};
      normalizedTalukaIds.forEach((talukaId) => {
        grouped[talukaId] = result.villages.filter((village) => {
          const villageTalukaId = Number((village as AddressOption & { taluka_id?: number }).taluka_id ?? talukaId);
          return villageTalukaId === talukaId;
        });
      });

      setVillagesByTaluka(grouped);
      setEntireCityOptions(result.entireCityOptions);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load villages.'));
      setVillagesByTaluka({});
      setEntireCityOptions([]);
    } finally {
      setLoading(false);
    }
  }, [normalizedTalukaIds]);

  useEffect(() => {
    void load();
  }, [load]);

  const villages = useMemo(() => {
    const merged = new Map<number, AddressOption>();
    Object.values(villagesByTaluka).forEach((items) => {
      items.forEach((village) => {
        merged.set(village.id, village);
      });
    });
    return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [villagesByTaluka]);

  const talukaNameKey = useMemo(
    () => orderedTalukaIds.map((id) => `${id}:${talukaNames[id] ?? ''}`).join('|'),
    [orderedTalukaIds, talukaNames],
  );

  const selectOptions = useMemo<LocationSelectOption[]>(
    () => buildGroupedVillageSelectOptions(
      orderedTalukaIds,
      talukaNames,
      entireCityOptions,
      villagesByTaluka,
    ),
    [entireCityOptions, villagesByTaluka, orderedTalukaIds, talukaNameKey, talukaNames],
  );

  return {
    villages,
    villagesByTaluka,
    entireCityOptions,
    selectOptions,
    loading,
    error,
    reload: load,
  };
}
