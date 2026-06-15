import { fetchApiData, fetchListItemById, type ApiRecord } from '../utils/apiHelpers';

import { apiClient } from './client';
import { postApiData, putApiData } from './postHelpers';

export { getNotifications as getFarmerNotifications, markNotificationRead, markAllNotificationsRead } from './notificationsApi';

export async function getFarmerProfile() {
  return fetchApiData<{ profile: Record<string, unknown> }>('/farmer/profile');
}

export async function updateFarmerProfile(payload: ApiRecord) {
  return putApiData('/farmer/profile', payload);
}

export async function updateFarmerProfilePhoto(formData: FormData) {
  return postApiData('/farmer/profile/photo', formData);
}

export async function removeFarmerProfilePhoto() {
  return putApiData('/farmer/profile/photo', { remove: true });
}

export async function updateFarmerProfilePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) {
  return putApiData('/farmer/profile/password', payload);
}

export async function updateFarmerProfileMpin(payload: {
  current_mpin: string;
  mpin: string;
  mpin_confirmation: string;
}) {
  return putApiData('/farmer/profile/mpin', payload);
}

export async function getFarmerDashboard() {
  return fetchApiData('/farmer/dashboard');
}

export async function getFarmerFarms() {
  return fetchApiData('/farmer/farms');
}

export async function getFarmerFarmDetail(id: number | string) {
  return fetchApiData(`/farmer/farms/${id}`);
}

export async function createFarmerFarm(payload: ApiRecord) {
  return postApiData('/farmer/farms', payload);
}

export async function updateFarmerFarm(id: number | string, payload: ApiRecord) {
  return putApiData(`/farmer/farms/${id}`, payload);
}

export async function getFarmerFarmBoundary(id: number | string) {
  return fetchApiData(`/farmer/farms/${id}/boundary`);
}

export async function saveFarmerFarmBoundary(id: number | string, payload: ApiRecord) {
  return postApiData(`/farmer/farms/${id}/boundary`, payload);
}

export async function updateFarmerFarmBoundary(id: number | string, payload: ApiRecord) {
  return putApiData(`/farmer/farms/${id}/boundary`, payload);
}

export async function deleteFarmerFarmBoundaryPoint(farmId: number | string, pointId: number | string) {
  const response = await apiClient.delete(`/farmer/farms/${farmId}/boundary-point/${pointId}`);
  return response.data.data;
}

export async function getFarmerPlots() {
  return fetchApiData('/farmer/plots');
}

export async function getFarmerPlotDetail(id: number | string) {
  return fetchApiData(`/farmer/plots/${id}`);
}

export async function getFarmerWeeklyUpdates() {
  return fetchApiData('/farmer/weekly-updates');
}

export async function getFarmerWeeklyUpdateDetail(id: number | string) {
  return fetchApiData(`/farmer/weekly-updates/${id}`);
}

export async function createFarmerWeeklyUpdate(payload: ApiRecord) {
  return postApiData('/farmer/weekly-updates', payload);
}

export async function getFarmerServices() {
  return fetchApiData('/farmer/services');
}

export async function getFarmerServiceSubmissions() {
  return fetchApiData('/farmer/service-submissions');
}

export async function getFarmerServiceDetail(id: number | string) {
  return fetchListItemById('/farmer/services', ['services'], id, 'service');
}

export async function getFarmerEvidence() {
  return fetchApiData('/farmer/evidence');
}

export async function uploadFarmerEvidence(formData: FormData) {
  return postApiData('/farmer/evidence', formData);
}

export async function getFarmerActivityLogs() {
  return fetchApiData('/farmer/activity-logs');
}

export async function getFarmerActivityLogDetail(id: number | string) {
  return fetchApiData(`/farmer/activity-logs/${id}`);
}

export async function createFarmerActivityLog(payload: ApiRecord | FormData) {
  return postApiData('/farmer/activity-logs', payload);
}

export async function getFarmerBaselineAssessments() {
  return fetchApiData('/farmer/baseline-assessments');
}

export async function getFarmerBaselineAssessmentDetail(id: number | string) {
  return fetchListItemById(
    '/farmer/baseline-assessments',
    ['baseline_assessments', 'assessments'],
    id,
    'baseline_assessment',
  );
}

export async function getFarmerSoilSamples() {
  return fetchApiData('/farmer/soil-samples');
}

export async function getFarmerSoilSampleDetail(id: number | string) {
  return fetchListItemById('/farmer/soil-samples', ['soil_samples', 'samples'], id, 'soil_sample');
}

export async function getFarmerVerificationStatus() {
  return fetchApiData('/farmer/verification-status');
}

export async function requestFarmerBaselineCorrection(payload: ApiRecord) {
  return postApiData('/farmer/baseline-correction-request', payload);
}

export async function getFarmerCarbonCalculations() {
  return fetchApiData('/farmer/carbon-calculations');
}

export async function getFarmerCarbonCalculationDetail(id: number | string) {
  return fetchApiData(`/farmer/carbon-calculations/${id}`);
}

export async function getFarmerFinalReports() {
  return fetchApiData('/farmer/final-reports');
}

export async function getFarmerFinalReportDetail(id: number | string) {
  return fetchApiData(`/farmer/final-reports/${id}`);
}

export async function downloadFarmerFinalReportFile(id: number | string) {
  return apiClient.get(`/farmer/final-reports/${id}/download`, {
    responseType: 'blob',
  });
}

export async function getFarmerRegenerativePractices() {
  return fetchApiData('/farmer/regenerative-practices');
}

export async function createFarmerRegenerativePractice(payload: ApiRecord) {
  return postApiData('/farmer/regenerative-practices', payload);
}

export async function getFarmerFeedstockCollections() {
  return fetchApiData('/farmer/feedstock-collections');
}

export async function createFarmerFeedstockCollection(payload: ApiRecord) {
  return postApiData('/farmer/feedstock-collections', payload);
}

export async function getFarmerBiocharFeedstock() {
  return fetchApiData('/farmer/biochar/feedstock');
}

export async function getFarmerBiocharBatches() {
  return fetchApiData('/farmer/biochar/batches');
}

export async function createFarmerBiocharBatch(payload: ApiRecord) {
  return postApiData('/farmer/biochar/batches', payload);
}

export async function getFarmerBiocharApplications() {
  return fetchApiData('/farmer/biochar/applications');
}

export async function createFarmerBiocharApplication(payload: ApiRecord) {
  return postApiData('/farmer/biochar/applications', payload);
}

export async function getFarmerAgroforestryPlantations() {
  return fetchApiData('/farmer/agroforestry/plantations');
}

export async function createFarmerAgroforestryPlantation(payload: ApiRecord) {
  return postApiData('/farmer/agroforestry/plantations', payload);
}

export async function getFarmerAgroforestryMonitoring() {
  return fetchApiData('/farmer/agroforestry/monitoring');
}

export async function createFarmerAgroforestryMonitoring(payload: ApiRecord) {
  return postApiData('/farmer/agroforestry/monitoring', payload);
}

export async function createFarmerCarbonEstimate(payload: ApiRecord) {
  return postApiData('/farmer/carbon-estimates', payload);
}

export async function getFarmerRegistryExports() {
  return fetchApiData('/farmer/registry-exports');
}

export async function createFarmerRegistryExport(payload: ApiRecord) {
  return postApiData('/farmer/registry-exports', payload);
}

export async function getFarmerSocialProfile() {
  return fetchApiData('/farmer/social-profile');
}
