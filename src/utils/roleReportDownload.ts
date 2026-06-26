import { Alert } from 'react-native';

import type { ReportDownloadFormat } from '../api/reportsApi';
import { downloadReportFile } from './reportFileDownload';

export async function downloadCompanyFinalReport(
  reportId: number,
  reportNumber?: string,
  format: ReportDownloadFormat = 'pdf',
) {
  const result = await downloadReportFile({
    role: 'company_user',
    reportId,
    format,
    fileNameBase: reportNumber ?? `company-report-${reportId}`,
    downloadKey: `company_user-${reportId}`,
  });

  if (!result.success) {
    Alert.alert('Download unavailable', result.message ?? 'Report download is not available yet.');
  }

  return result;
}

export async function downloadFieldOfficerReport(
  report: { id: number; reportId: string; isDraft?: boolean },
  format: ReportDownloadFormat = 'pdf',
) {
  if (report.isDraft) {
    const message = 'Draft reports cannot be downloaded until they are submitted.';

    return { success: false, message };
  }

  return downloadReportFile({
    role: 'field_officer',
    reportId: report.id,
    format,
    fileNameBase: report.reportId,
    downloadKey: `field_officer-${report.id}`,
  });
}

export async function downloadFarmerFinalReport(
  reportId: number,
  reportNumber?: string,
  format: ReportDownloadFormat = 'pdf',
) {
  return downloadReportFile({
    role: 'farmer',
    reportId,
    format,
    fileNameBase: reportNumber ?? `farmer-report-${reportId}`,
    downloadKey: `farmer-${reportId}`,
  });
}
