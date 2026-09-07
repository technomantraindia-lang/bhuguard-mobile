import { fetchApiData } from '../utils/apiHelpers';
import type { EntireCityOption } from '../utils/workingAreaScope';

export interface AddressOption {
  id: number;
  name: string;
  pincode?: string | null;
}

export interface VillagesLookupResult {
  villages: AddressOption[];
  entireCityOptions: EntireCityOption[];
  total: number;
}

type VillagesApiPayload = {
  villages?: AddressOption[];
  entire_city_options?: EntireCityOption[];
  total?: number;
};

function parseVillagesPayload(data: VillagesApiPayload): VillagesLookupResult {
  return {
    villages: data.villages ?? [],
    entireCityOptions: data.entire_city_options ?? [],
    total: data.total ?? (data.villages?.length ?? 0),
  };
}

export async function getStates() {
  const data = await fetchApiData<{ states: AddressOption[] } | AddressOption[]>('/address/states');

  if (Array.isArray(data)) {
    return data;
  }

  return data.states ?? [];
}

export async function getDistricts(state = 'Gujarat', stateId?: number) {
  const params = stateId ? { state_id: stateId } : { state };
  const data = await fetchApiData<{ districts: AddressOption[] }>('/address/districts', params);
  return data.districts ?? [];
}

export async function getTalukas(districtId: number) {
  const data = await fetchApiData<{ talukas: AddressOption[] }>('/address/talukas', {
    district_id: districtId,
  });
  return data.talukas ?? [];
}

export async function getVillages(talukaId: number, search?: string): Promise<VillagesLookupResult> {
  const data = await fetchApiData<VillagesApiPayload>('/address/villages', {
    taluka_id: talukaId,
    search: search?.trim() || undefined,
  });

  return parseVillagesPayload(data);
}

export async function getVillagesForTalukas(
  talukaIds: number[],
  search?: string,
): Promise<VillagesLookupResult> {
  const normalizedIds = Array.from(new Set(talukaIds.map((id) => Number(id)).filter((id) => id > 0)));

  if (normalizedIds.length === 0) {
    return { villages: [], entireCityOptions: [], total: 0 };
  }

  if (normalizedIds.length === 1) {
    return getVillages(normalizedIds[0], search);
  }

  const data = await fetchApiData<VillagesApiPayload>('/address/villages', {
    taluka_ids: normalizedIds.map(String),
    search: search?.trim() || undefined,
  });

  return parseVillagesPayload(data);
}

export async function getTalukaPincode(talukaId: number) {
  const data = await fetchApiData<{ pincode: string | null }>('/address/pincode', {
    taluka_id: talukaId,
  });

  return data.pincode ?? '';
}
