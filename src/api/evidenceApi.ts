import type { AxiosError } from 'axios';

import { apiClient } from './client';
import type { EvidenceRole } from '../constants/evidenceCategories';
import { normalizeEvidenceCategory } from '../constants/evidenceCategories';
import { extractApiErrorMessage, isApiNotFound } from '../utils/apiError';
import { fetchApiData } from '../utils/apiHelpers';
import type { ApiRecord } from '../utils/apiHelpers';
import {
  appendFarmerEvidenceFields,
  appendVisitEvidenceFields,
  buildFormDataFilePart,
  type LiveCapturedEvidence,
} from '../utils/liveEvidenceCapture';

export interface EvidenceUploadPayload {
  evidence_category: string;
  title?: string;
  remarks?: string;
  notes?: string;
  related_module?: string;
  related_id?: number | string;
  farmer_id?: number | string;
  company_id?: number | string;
  farm_id?: number | string;
  site_id?: number | string;
  visit_id?: number | string;
  service_submission_id?: number | string;
  company_service_submission_id?: number | string;
  weekly_update_id?: number | string;
  waste_record_id?: number | string;
  industrial_carbon_record_id?: number | string;
  biochar_record_id?: number | string;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy?: number | null;
  captured_at?: string;
  slip_number?: string;
  gross_weight?: string | number;
  tare_weight?: string | number;
  net_weight?: string | number;
  unit?: string;
  weighing_date?: string;
  document_type?: string;
}

export interface EvidenceListParams {
  visitId?: number | string;
  farmId?: number | string;
  submissionId?: number | string;
}

function appendScalar(formData: FormData, key: string, value: unknown): void {
  if (value == null || value === '') {
    return;
  }

  formData.append(key, String(value));
}

export function buildEvidenceFormData(
  file: LiveCapturedEvidence | { uri: string; name: string; type: string },
  payload: EvidenceUploadPayload,
  role: EvidenceRole,
): FormData {
  const formData = new FormData();
  const category = normalizeEvidenceCategory(payload.evidence_category);

  if ('capturedAt' in file) {
    if (role === 'field_officer') {
      appendVisitEvidenceFields(formData, file);
    } else {
      appendFarmerEvidenceFields(formData, file);
    }
  } else {
    formData.append(
      'file',
      buildFormDataFilePart(file.uri, file.name, file.type) as unknown as Blob,
    );
  }

  formData.append('category', category);
  formData.append('evidence_category', category);

  appendScalar(formData, 'title', payload.title);
  appendScalar(formData, 'remarks', payload.remarks ?? payload.notes);
  appendScalar(formData, 'notes', payload.notes ?? payload.remarks ?? payload.title);
  appendScalar(formData, 'related_module', payload.related_module);
  appendScalar(formData, 'related_id', payload.related_id);
  appendScalar(formData, 'farmer_id', payload.farmer_id);
  appendScalar(formData, 'company_id', payload.company_id);
  appendScalar(formData, 'farm_id', payload.farm_id);
  appendScalar(formData, 'site_id', payload.site_id);
  appendScalar(formData, 'visit_id', payload.visit_id);
  appendScalar(formData, 'service_submission_id', payload.service_submission_id);
  appendScalar(
    formData,
    'company_service_submission_id',
    payload.company_service_submission_id ?? payload.service_submission_id,
  );
  appendScalar(formData, 'weekly_update_id', payload.weekly_update_id);
  appendScalar(formData, 'waste_record_id', payload.waste_record_id);
  appendScalar(formData, 'industrial_carbon_record_id', payload.industrial_carbon_record_id);
  appendScalar(formData, 'biochar_record_id', payload.biochar_record_id);
  appendScalar(formData, 'slip_number', payload.slip_number);
  appendScalar(formData, 'gross_weight', payload.gross_weight);
  appendScalar(formData, 'tare_weight', payload.tare_weight);
  appendScalar(formData, 'net_weight', payload.net_weight);
  appendScalar(formData, 'unit', payload.unit);
  appendScalar(formData, 'weighing_date', payload.weighing_date);
  appendScalar(formData, 'document_type', payload.document_type);

  if (!('capturedAt' in file)) {
    appendScalar(formData, 'latitude', payload.latitude);
    appendScalar(formData, 'longitude', payload.longitude);
    appendScalar(formData, 'gps_accuracy', payload.gps_accuracy);
    appendScalar(formData, 'captured_at', payload.captured_at);
  }

  return formData;
}

function mapEvidenceError(error: unknown, fallback: string): Error {
  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error(extractApiErrorMessage(error, fallback));
}

function rolePrefix(role: EvidenceRole): string {
  if (role === 'farmer') {
    return '/farmer/evidence';
  }

  if (role === 'company_user') {
    return '/company/evidence';
  }

  return '/field-officer';
}

export async function getEvidence(role: EvidenceRole, params: EvidenceListParams = {}): Promise<ApiRecord> {
  try {
    if (role === 'farmer') {
      return fetchApiData('/farmer/evidence');
    }

    if (role === 'company_user') {
      return fetchApiData('/company/evidence');
    }

    if (params.visitId == null) {
      throw new Error('Visit ID is required for field officer evidence.');
    }

    return fetchApiData(`/field-officer/assignments/${params.visitId}/evidence`);
  } catch (error) {
    if (isApiNotFound(error)) {
      throw new Error('Evidence list API is not available yet.');
    }

    throw mapEvidenceError(error, 'Unable to load evidence.');
  }
}

export async function getEvidenceDetail(
  role: 'farmer' | 'company_user',
  id: number | string,
): Promise<ApiRecord> {
  try {
    return fetchApiData(`${rolePrefix(role)}/${id}`);
  } catch (error) {
    throw mapEvidenceError(error, 'Unable to load evidence details.');
  }
}

export async function downloadEvidence(role: 'farmer' | 'company_user', id: number | string) {
  try {
    return apiClient.get(`${rolePrefix(role)}/${id}/download`, {
      responseType: 'arraybuffer',
    });
  } catch (error) {
    throw mapEvidenceError(error, 'Unable to download evidence.');
  }
}

export async function uploadEvidence(
  role: EvidenceRole,
  formData: FormData,
  visitId?: number | string,
): Promise<ApiRecord> {
  try {
    if (role === 'farmer') {
      const response = await apiClient.post('/farmer/evidence', formData);
      return (response.data.data ?? response.data) as ApiRecord;
    }

    if (role === 'company_user') {
      const response = await apiClient.post('/company/evidence', formData);
      return (response.data.data ?? response.data) as ApiRecord;
    }

    if (visitId == null) {
      throw new Error('Visit ID is required for field officer evidence upload.');
    }

    const response = await apiClient.post(`/field-officer/assignments/${visitId}/evidence`, formData);
    return (response.data.data ?? response.data) as ApiRecord;
  } catch (error) {
    const status = (error as AxiosError)?.response?.status;

    if (status === 403) {
      throw new Error(extractApiErrorMessage(error, 'You do not have permission to upload evidence.'));
    }

    if (status === 422) {
      throw new Error(extractApiErrorMessage(error, 'Evidence validation failed.'));
    }

    if (isApiNotFound(error)) {
      throw new Error('Evidence upload API is not available yet.');
    }

    throw mapEvidenceError(error, 'Evidence upload failed.');
  }
}

export async function uploadFarmerEvidence(formData: FormData): Promise<ApiRecord> {
  return uploadEvidence('farmer', formData);
}

export async function uploadCompanyEvidence(formData: FormData): Promise<ApiRecord> {
  return uploadEvidence('company_user', formData);
}

export async function uploadVerificationEvidence(
  visitId: number | string,
  formData: FormData,
): Promise<ApiRecord> {
  return uploadEvidence('field_officer', formData, visitId);
}

export async function getFarmerEvidence(): Promise<ApiRecord> {
  return getEvidence('farmer');
}

export async function getCompanyEvidence(): Promise<ApiRecord> {
  return getEvidence('company_user');
}

export async function getAssignmentEvidence(visitId: number | string): Promise<ApiRecord> {
  return getEvidence('field_officer', { visitId });
}

export async function getFieldOfficerEvidence(visitId: number | string): Promise<ApiRecord> {
  return getAssignmentEvidence(visitId);
}

export async function uploadVisitEvidence(
  visitId: number | string,
  formData: FormData,
): Promise<ApiRecord> {
  return uploadVerificationEvidence(visitId, formData);
}
