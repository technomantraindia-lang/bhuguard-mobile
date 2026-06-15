import { fetchApiData } from '../utils/apiHelpers';

export interface AddressOption {
  id: number;
  name: string;
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

export async function getVillages(talukaId: number, search?: string) {
  const data = await fetchApiData<{ villages: AddressOption[] }>('/address/villages', {
    taluka_id: talukaId,
    search: search?.trim() || undefined,
  });
  return data.villages ?? [];
}
