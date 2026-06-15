import type { ApiSuccessResponse } from '../types/auth';
import { fetchApiData, type ApiRecord } from '../utils/apiHelpers';

import { apiClient } from './client';
import { postApiData } from './postHelpers';

export { getNotifications as getFieldOfficerNotifications, markNotificationRead, markAllNotificationsRead } from './notificationsApi';

export async function getFieldOfficerProfile() {
  return fetchApiData<{ user: Record<string, unknown> }>('/field-officer/profile');
}

export async function getFieldOfficerDashboard() {
  return fetchApiData<{ dashboard: Record<string, unknown> }>('/field-officer/dashboard');
}

export async function getVisitAssignments() {
  return fetchApiData('/field-officer/assignments');
}

export async function getFieldOfficerFarmers() {
  return fetchApiData('/field-officer/farmers');
}

export async function getVisitAssignmentDetail(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}`);
}

export async function acceptVisit(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/accept`,
  );
  return response.data.data;
}

export async function startVisit(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/start`,
  );
  return response.data.data;
}

export async function checkInVisit(id: number | string, payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/check-in`,
    payload,
  );
  return response.data.data;
}

export async function startVerification(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/start-verification`,
  );
  return response.data.data;
}

export async function completeVisit(id: number | string) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/complete`,
  );
  return response.data.data;
}

export async function submitChecklist(id: number | string, payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/checklist`,
    payload,
  );
  return response.data.data;
}

export async function uploadVisitEvidence(id: number | string, formData: FormData) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/evidence`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return response.data.data;
}

export async function submitVisitReport(id: number | string, payload: ApiRecord) {
  const response = await apiClient.post<ApiSuccessResponse<ApiRecord>>(
    `/field-officer/assignments/${id}/submit-report`,
    payload,
  );
  return response.data.data;
}

export async function getFieldOfficerFarmerDetail(id: number | string) {
  return fetchApiData<{ farmer: ApiRecord }>(`/field-officer/farmers/${id}`);
}

export async function getAssignmentChecklist(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}/checklist`);
}

export async function getAssignmentReport(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}/report`);
}

export async function getAssignmentEvidence(id: number | string) {
  return fetchApiData(`/field-officer/assignments/${id}/evidence`);
}

export async function getVerificationReports() {
  return getVisitAssignments();
}

export async function getVerificationReportDetail(id: number | string) {
  return getAssignmentReport(id);
}

export async function getSoilSamples() {
  return fetchApiData('/field-officer/soil-samples');
}

export async function getBaselineAssessments() {
  return fetchApiData('/field-officer/baseline-assessments');
}

export async function getActivityLogs() {
  return fetchApiData('/field-officer/activity-logs');
}

export async function getMonitoringReports() {
  return fetchApiData('/field-officer/monitoring-reports');
}

export async function createFarmerOnboarding(formData: FormData): Promise<ApiRecord> {
  const response = await apiClient.post<ApiSuccessResponse<{ farmer: ApiRecord }>>(
    '/field-officer/farmers',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data?.farmer ?? (response.data.data as unknown as ApiRecord);
}

export async function createFarmerPlot(farmerId: number | string, payload: ApiRecord) {
  return postApiData(`/field-officer/farmers/${farmerId}/plots`, payload);
}

export async function createOfficerActivityLog(payload: ApiRecord) {
  return postApiData('/field-officer/farmer-activity-logs', payload);
}

export async function createOfficerBaselineAssessment(payload: ApiRecord) {
  return postApiData('/field-officer/baseline-assessments', payload);
}

export async function createOfficerSoilSample(payload: ApiRecord) {
  return postApiData('/field-officer/soil-samples', payload);
}

export async function createOfficerMonitoringReport(payload: ApiRecord) {
  return postApiData('/field-officer/monitoring-reports', payload);
}
