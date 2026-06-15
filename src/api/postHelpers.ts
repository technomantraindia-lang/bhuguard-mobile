import type { ApiSuccessResponse } from '../types/auth';

import { apiClient } from './client';
import type { ApiRecord } from '../utils/apiHelpers';

export async function postApiData<T = ApiRecord>(path: string, payload?: ApiRecord | FormData): Promise<T> {
  const response = await apiClient.post<ApiSuccessResponse<T>>(path, payload ?? {});
  return response.data.data;
}

export async function putApiData<T = ApiRecord>(path: string, payload: ApiRecord): Promise<T> {
  const response = await apiClient.put<ApiSuccessResponse<T>>(path, payload);
  return response.data.data;
}

export async function putFormData<T = ApiRecord>(path: string, payload: FormData): Promise<T> {
  const response = await apiClient.put<ApiSuccessResponse<T>>(path, payload);
  return response.data.data;
}
