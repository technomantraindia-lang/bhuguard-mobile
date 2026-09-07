import { useCallback, useEffect, useMemo, useState } from 'react';

import { getDistricts, getTalukas, type AddressOption } from '../api/addressApi';
import { getApiErrorMessage } from '../api/authApi';
import { logWorkingAreaDiagnostics } from '../utils/addressVillageDiagnostics';

export interface WorkingAreaTalukaOption extends AddressOption {
  district_id: number;
}

export function useWorkingAreaAddressOptions(state: string, districtIds: number[]) {
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [talukasByDistrict, setTalukasByDistrict] = useState<Record<number, WorkingAreaTalukaOption[]>>({});
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTalukas, setLoadingTalukas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedDistrictIds = useMemo(
    () => Array.from(new Set(districtIds.map((id) => Number(id)).filter((id) => id > 0))),
    [districtIds],
  );

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

  const loadTalukas = useCallback(async () => {
    if (normalizedDistrictIds.length === 0) {
      setTalukasByDistrict({});
      return;
    }

    setLoadingTalukas(true);
    setError(null);

    try {
      const grouped: Record<number, WorkingAreaTalukaOption[]> = {};

      await Promise.all(
        normalizedDistrictIds.map(async (districtId) => {
          const talukas = await getTalukas(districtId);
          grouped[districtId] = talukas.map((taluka) => ({
            ...taluka,
            district_id: Number((taluka as WorkingAreaTalukaOption).district_id ?? districtId),
          }));

          logWorkingAreaDiagnostics({
            districtId,
            talukaCount: grouped[districtId].length,
            talukaNames: grouped[districtId].map((item) => item.name),
          });
        }),
      );

      setTalukasByDistrict(grouped);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load talukas.'));
      setTalukasByDistrict({});
    } finally {
      setLoadingTalukas(false);
    }
  }, [normalizedDistrictIds]);

  useEffect(() => {
    void loadDistricts();
  }, [loadDistricts]);

  useEffect(() => {
    void loadTalukas();
  }, [loadTalukas]);

  const talukaOptions = useMemo(() => {
    const merged = new Map<number, WorkingAreaTalukaOption>();

    normalizedDistrictIds.forEach((districtId) => {
      (talukasByDistrict[districtId] ?? []).forEach((taluka) => {
        merged.set(taluka.id, taluka);
      });
    });

    return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [normalizedDistrictIds, talukasByDistrict]);

  const districtNameById = useMemo(() => {
    const map: Record<number, string> = {};
    districts.forEach((district) => {
      map[district.id] = district.name;
    });
    return map;
  }, [districts]);

  return {
    districts,
    talukaOptions,
    talukasByDistrict,
    districtNameById,
    loadingDistricts,
    loadingTalukas,
    loading: loadingDistricts || loadingTalukas,
    error,
    reloadDistricts: loadDistricts,
    reloadTalukas: loadTalukas,
  };
}
