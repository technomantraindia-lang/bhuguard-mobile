import type { ApiSuccessResponse } from '../types/auth';
import type { AssignedLocationsPayload } from '../types/assignedLocations';

import { apiClient } from '../api/client';

export type ApiRecord = Record<string, unknown>;

export async function fetchApiData<T = ApiRecord>(
  path: string,
  params?: Record<string, string | number | string[] | undefined>,
): Promise<T> {
  const response = await apiClient.get<ApiSuccessResponse<T>>(path, { params });
  return response.data.data;
}

export async function fetchListItemById(
  listPath: string,
  listKeys: string[],
  id: number | string,
  wrapperKey?: string,
): Promise<ApiRecord> {
  const data = await fetchApiData(listPath);
  const items = extractList(data as ApiRecord, listKeys);
  const match = items.find((item) => String(item?.id ?? '') === String(id));

  if (!match) {
    const error = new Error('Record not found.') as Error & { response?: { status: number } };
    error.response = { status: 404 };
    throw error;
  }

  return wrapperKey ? { [wrapperKey]: match } : match;
}

export function extractList(data: ApiRecord | ApiRecord[] | null | undefined, keys: string[]): ApiRecord[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  for (const key of keys) {
    const value = data[key];

    if (Array.isArray(value)) {
      return value as ApiRecord[];
    }
  }

  const nested = data.data;

  if (Array.isArray(nested)) {
    return nested as ApiRecord[];
  }

  if (nested && typeof nested === 'object') {
    const paginated = nested as ApiRecord;
    const items = paginated.data;

    if (Array.isArray(items)) {
      return items as ApiRecord[];
    }
  }

  return [];
}

export function pickString(item: ApiRecord | null | undefined, ...keys: string[]): string {
  if (!item) {
    return '-';
  }

  for (const key of keys) {
    const value = item[key];

    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object') {
        continue;
      }

      return String(value);
    }
  }

  return '-';
}

export function pickNestedString(item: ApiRecord | null | undefined, path: string): string {
  if (!item) {
    return '-';
  }

  const parts = path.split('.');
  let current: unknown = item;

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return '-';
    }

    current = (current as ApiRecord)[part];
  }

  if (current === null || current === undefined || current === '') {
    return '-';
  }

  if (typeof current === 'object') {
    return '-';
  }

  return String(current);
}

export function formatDisplay(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export const defaultAssignedArea: AssignedLocationsPayload = {
  has_assignment: false,
  districts: [],
  talukas: [],
  villages: [],
};

function isAssignedAreaObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asAssignedArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asIdList(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return item;
      }
      if (typeof item === 'string' && item.trim() !== '' && Number.isFinite(Number(item))) {
        return Number(item);
      }
      if (isAssignedAreaObject(item) && item.id != null && Number.isFinite(Number(item.id))) {
        return Number(item.id);
      }
      return null;
    })
    .filter((id): id is number => id != null && id > 0);
}

function locationEntriesFromIds(
  ids: number[],
): AssignedLocationsPayload['districts'] {
  return ids.map((id) => ({ id, name: `ID ${id}` }));
}

/**
 * Normalize assigned-area / allocated-locations payloads across known envelopes.
 */
export function normalizeAssignedArea(source: unknown): AssignedLocationsPayload {
  if (!isAssignedAreaObject(source)) {
    return { ...defaultAssignedArea, districts: [], talukas: [], villages: [] };
  }

  const root = source;
  const data = isAssignedAreaObject(root.data) ? root.data : null;
  const dashboard = isAssignedAreaObject(root.dashboard)
    ? root.dashboard
    : data && isAssignedAreaObject(data.dashboard)
      ? data.dashboard
      : null;
  const user = isAssignedAreaObject(root.user)
    ? root.user
    : data && isAssignedAreaObject(data.user)
      ? data.user
      : null;
  const artisanProfile = isAssignedAreaObject(root.artisan_profile)
    ? root.artisan_profile
    : isAssignedAreaObject(user?.artisan_profile)
      ? (user?.artisan_profile as Record<string, unknown>)
      : data && isAssignedAreaObject(data.artisan_profile)
        ? (data.artisan_profile as Record<string, unknown>)
        : null;

  const candidates: unknown[] = [
    root.assigned_area,
    root.assignedArea,
    data?.assigned_area,
    data?.assignedArea,
    dashboard?.assigned_area,
    dashboard?.assignedArea,
    user?.assigned_area,
    user?.assignedArea,
    artisanProfile?.assigned_area,
    artisanProfile?.assignedArea,
    isAssignedAreaObject(root.field_officer) ? root.field_officer.assigned_area : null,
    isAssignedAreaObject(root.field_officer) ? root.field_officer.assignedArea : null,
    isAssignedAreaObject(root.fieldOfficer) ? root.fieldOfficer.assigned_area : null,
    isAssignedAreaObject(root.fieldOfficer) ? root.fieldOfficer.assignedArea : null,
    data,
    root,
  ];

  let area: Record<string, unknown> | null = null;

  for (const candidate of candidates) {
    if (!isAssignedAreaObject(candidate)) {
      continue;
    }

    if (
      'villages' in candidate ||
      'talukas' in candidate ||
      'districts' in candidate ||
      'has_assignment' in candidate ||
      'work_village_ids' in candidate ||
      'work_taluka_ids' in candidate ||
      'work_district_ids' in candidate ||
      'working_village_ids' in candidate
    ) {
      area = candidate;
      break;
    }
  }

  if (!area) {
    return { ...defaultAssignedArea, districts: [], talukas: [], villages: [] };
  }

  let districts = asAssignedArray<AssignedLocationsPayload['districts'][number]>(area.districts);
  let talukas = asAssignedArray<AssignedLocationsPayload['talukas'][number]>(area.talukas);
  let villages = asAssignedArray<AssignedLocationsPayload['villages'][number]>(area.villages);

  const workDistrictIds = asIdList(
    area.work_district_ids ?? area.workDistrictIds ?? root.work_district_ids ?? data?.work_district_ids,
  );
  const workTalukaIds = asIdList(
    area.work_taluka_ids ?? area.workTalukaIds ?? root.work_taluka_ids ?? data?.work_taluka_ids,
  );
  const workVillageIds = asIdList(
    area.work_village_ids ??
      area.workVillageIds ??
      area.working_village_ids ??
      root.work_village_ids ??
      data?.work_village_ids ??
      artisanProfile?.working_village_ids,
  );

  if (districts.length === 0 && workDistrictIds.length > 0) {
    districts = locationEntriesFromIds(workDistrictIds);
  }
  if (talukas.length === 0 && workTalukaIds.length > 0) {
    talukas = locationEntriesFromIds(workTalukaIds);
  }
  if (villages.length === 0 && workVillageIds.length > 0) {
    villages = locationEntriesFromIds(workVillageIds);
  }

  const explicitHasAssignment =
    typeof area.has_assignment === 'boolean'
      ? area.has_assignment
      : typeof root.has_assignment === 'boolean'
        ? (root.has_assignment as boolean)
        : typeof data?.has_assignment === 'boolean'
          ? (data.has_assignment as boolean)
          : null;

  const hasAssignment =
    explicitHasAssignment === true ||
    districts.length > 0 ||
    talukas.length > 0 ||
    villages.length > 0 ||
    workDistrictIds.length > 0 ||
    workTalukaIds.length > 0 ||
    workVillageIds.length > 0;

  return {
    has_assignment: hasAssignment,
    districts,
    talukas,
    villages,
  };
}
