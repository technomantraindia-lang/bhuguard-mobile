import type { AxiosResponse } from 'axios';

import { apiClient } from './client';
import { fetchApiData } from '../utils/apiHelpers';

export type ReportRole = 'farmer' | 'company_user' | 'field_officer';

export type ReportDownloadFormat = 'pdf' | 'excel' | 'doc';

export interface ReportsListParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

const REPORTS_BASE_PATH: Record<ReportRole, string> = {
  farmer: '/farmer/final-reports',
  company_user: '/company/final-reports',
  field_officer: '/field-officer/reports',
};

const REPORTS_LIST_KEYS: Record<ReportRole, string[]> = {
  farmer: ['final_reports', 'reports', 'data'],
  company_user: ['final_reports', 'reports', 'data'],
  field_officer: ['reports', 'data'],
};

const REPORTS_DETAIL_KEYS: Record<ReportRole, string[]> = {
  farmer: ['final_report', 'report', 'data'],
  company_user: ['final_report', 'report', 'data'],
  field_officer: ['report', 'data'],
};

export function resolveReportsBasePath(role: ReportRole): string {
  return REPORTS_BASE_PATH[role];
}

export function resolveReportsListKeys(role: ReportRole): string[] {
  return REPORTS_LIST_KEYS[role];
}

export function resolveReportsDetailKeys(role: ReportRole): string[] {
  return REPORTS_DETAIL_KEYS[role];
}

export function extensionForReportFormat(format: ReportDownloadFormat): string {
  switch (format) {
    case 'excel':
      return 'xlsx';
    case 'doc':
      return 'docx';
    default:
      return 'pdf';
  }
}

export async function getReports(role: ReportRole, params?: ReportsListParams) {
  return fetchApiData(
    REPORTS_BASE_PATH[role],
    params as Record<string, string | number | undefined> | undefined,
  );
}

export async function getReportDetail(role: ReportRole, id: number | string) {
  return fetchApiData(`${REPORTS_BASE_PATH[role]}/${id}`);
}

export async function downloadReport(
  role: ReportRole,
  id: number | string,
  format: ReportDownloadFormat = 'pdf',
): Promise<AxiosResponse<ArrayBuffer>> {
  return apiClient.get(`${REPORTS_BASE_PATH[role]}/${id}/download`, {
    params: { format },
    responseType: 'arraybuffer',
    headers: {
      Accept: 'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/json',
    },
  });
}

export {
  getReports as getRoleReports,
  getReportDetail as getRoleReportDetail,
  downloadReport as downloadRoleReport,
};
