import type { AxiosError } from 'axios';

import { apiClient } from './client';
import type { ApiRecord } from '../utils/apiHelpers';
import { extractApiErrorMessage } from '../utils/apiError';

export interface VisitCheckInPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  captured_at: string;
  distance_from_target: number;
  allowed_radius: number;
  checkin_status: 'checked_in' | 'outside_radius_pending';
  outside_radius_reason?: string;
}

export interface VisitCheckInResult {
  checkin_status?: string;
  distance_from_target?: number;
  allowed_radius?: number;
  gps_accuracy?: number;
  max_allowed_accuracy?: number;
  assignment?: ApiRecord;
  checkin?: ApiRecord;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function normalizeVisitId(visitId: number | string | null | undefined): number {
  const id = Number(visitId);

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('Visit ID is missing. Please reopen this visit and try again.');
  }

  return id;
}

function mapPayloadToBackend(payload: VisitCheckInPayload): ApiRecord {
  const isOverride = payload.checkin_status === 'outside_radius_pending';

  return {
    latitude: payload.latitude,
    longitude: payload.longitude,
    accuracy: payload.accuracy,
    gps_captured_at: payload.captured_at,
    captured_at: payload.captured_at,
    distance_from_farm_meter: payload.distance_from_target,
    distance_from_target: payload.distance_from_target,
    allowed_radius_meter: payload.allowed_radius,
    allowed_radius: payload.allowed_radius,
    checkin_status: payload.checkin_status,
    location_status: isOverride ? 'override_requested' : 'verified',
    outside_radius_reason: payload.outside_radius_reason ?? null,
    override_reason: payload.outside_radius_reason ?? null,
  };
}

function mapCheckInError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message) {
    return error;
  }

  const axiosError = error as AxiosError<{ message?: string }>;
  const status = axiosError.response?.status;

  if (status === 403) {
    return new Error(extractApiErrorMessage(error, 'You do not have permission to check in to this visit.'));
  }

  if (status === 422) {
    return new Error(extractApiErrorMessage(error, 'Unable to complete GPS check-in.'));
  }

  if ((status ?? 0) >= 500) {
    return new Error(extractApiErrorMessage(error, 'Server error. Please try again.'));
  }

  return new Error(extractApiErrorMessage(error, fallback));
}

async function postVisitCheckIn(
  visitId: number | string,
  payload: VisitCheckInPayload,
  overridePhotoUri?: string,
): Promise<VisitCheckInResult> {
  const id = normalizeVisitId(visitId);
  const body = mapPayloadToBackend(payload);

  if (overridePhotoUri) {
    const formData = new FormData();

    Object.entries(body).forEach(([key, value]) => {
      if (value != null) {
        formData.append(key, String(value));
      }
    });

    formData.append('override_photo', {
      uri: overridePhotoUri,
      name: 'override.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    formData.append('client_pre_stamped', '1');

    const response = await apiClient.post<ApiSuccessResponse<VisitCheckInResult>>(
      `/field-officer/visits/${id}/check-in`,
      formData,
    );

    return response.data.data;
  }

  const response = await apiClient.post<ApiSuccessResponse<VisitCheckInResult>>(
    `/field-officer/visits/${id}/check-in`,
    body,
  );

  return response.data.data;
}

export async function submitVisitCheckIn(
  visitId: number | string,
  payload: Omit<VisitCheckInPayload, 'checkin_status' | 'outside_radius_reason'>,
): Promise<VisitCheckInResult> {
  try {
    return await postVisitCheckIn(visitId, {
      ...payload,
      checkin_status: 'checked_in',
    });
  } catch (error) {
    throw mapCheckInError(error, 'Unable to complete GPS check-in.');
  }
}

export async function requestOutsideRadiusCheckIn(
  visitId: number | string,
  payload: Omit<VisitCheckInPayload, 'checkin_status'> & { outside_radius_reason: string },
  overridePhotoUri?: string,
): Promise<VisitCheckInResult> {
  if (!payload.outside_radius_reason.trim()) {
    throw new Error('Reason is required for outside radius check-in.');
  }

  try {
    return await postVisitCheckIn(
      visitId,
      {
        ...payload,
        checkin_status: 'outside_radius_pending',
      },
      overridePhotoUri,
    );
  } catch (error) {
    throw mapCheckInError(error, 'Unable to submit outside radius check-in request.');
  }
}
