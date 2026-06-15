import type { ApiSuccessResponse } from '../types/auth';

import { apiClient } from '../api/client';

export type ApiRecord = Record<string, unknown>;

export async function fetchApiData<T = ApiRecord>(
  path: string,
  params?: Record<string, string | number | undefined>,
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

export function extractList(data: ApiRecord, keys: string[]): ApiRecord[] {
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
