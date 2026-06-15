import { fetchApiData, type ApiRecord } from '../utils/apiHelpers';

import { postApiData, putApiData } from './postHelpers';

export { getNotifications as getCompanyNotifications, markNotificationRead, markAllNotificationsRead } from './notificationsApi';

export async function getCompanyProfile() {
  return fetchApiData<{ profile: Record<string, unknown> }>('/company/profile');
}

export async function updateCompanyProfile(payload: ApiRecord) {
  return putApiData('/company/profile', payload);
}

export async function getCompanyDashboard() {
  return fetchApiData('/company/dashboard');
}

export async function getCompanySites() {
  return fetchApiData('/company/sites');
}

export async function getCompanySiteDetail(id: number | string) {
  return fetchApiData(`/company/sites/${id}`);
}

export async function createCompanySite(payload: ApiRecord) {
  return postApiData('/company/sites', payload);
}

export async function getCompanyServices() {
  return fetchApiData('/company/services');
}

export async function getCompanyServiceSubmissions() {
  return fetchApiData('/company/service-submissions');
}

export async function createCompanyServiceSubmission(payload: ApiRecord) {
  return postApiData('/company/service-submissions', payload);
}

export async function getCompanyServiceSubmissionDetail(id: number | string) {
  return fetchApiData(`/company/service-submissions/${id}`);
}

export async function getCompanyWasteRecords() {
  return fetchApiData('/company/waste-records');
}

export async function getCompanyWasteRecordDetail(id: number | string) {
  return fetchApiData(`/company/waste-records/${id}`);
}

export async function createCompanyWasteRecord(payload: ApiRecord) {
  return postApiData('/company/waste-records', payload);
}

export async function getCompanyIndustrialCarbonRecords() {
  return fetchApiData('/company/industrial-carbon-records');
}

export async function getCompanyIndustrialCarbonRecordDetail(id: number | string) {
  return fetchApiData(`/company/industrial-carbon-records/${id}`);
}

export async function createCompanyIndustrialCarbonRecord(payload: ApiRecord) {
  return postApiData('/company/industrial-carbon-records', payload);
}

export async function getCompanyBiocharRecords() {
  return fetchApiData('/company/biochar-records');
}

export async function getCompanyBiocharRecordDetail(id: number | string) {
  return fetchApiData(`/company/biochar-records/${id}`);
}

export async function createCompanyBiocharRecord(payload: ApiRecord) {
  return postApiData('/company/biochar-records', payload);
}

export async function getCompanyEvidence() {
  return fetchApiData('/company/evidence');
}

export async function uploadCompanyEvidence(formData: FormData) {
  return postApiData('/company/evidence', formData);
}

export async function getCompanyVerificationStatus() {
  return fetchApiData('/company/verification-status');
}

export async function getCompanyCarbonCalculations() {
  return fetchApiData('/company/carbon-calculations');
}

export async function getCompanyCarbonCalculationDetail(id: number | string) {
  return fetchApiData(`/company/carbon-calculations/${id}`);
}

export async function getCompanyFinalReports() {
  return fetchApiData('/company/final-reports');
}

export async function getCompanyFinalReportDetail(id: number | string) {
  return fetchApiData(`/company/final-reports/${id}`);
}

export async function getCompanyRegistryExports() {
  return fetchApiData('/company/registry-exports');
}

export async function createCompanyRegistryExport(payload: ApiRecord) {
  return postApiData('/company/registry-exports', payload);
}
