import { Alert, Platform, Share } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import type { FarmerReportItem } from './farmerReportHelpers';
import { REPORT_FILE_NOT_GENERATED_MESSAGE } from './reportFileDownload';
import { downloadFarmerFinalReport as downloadFarmerFinalReportFile } from './roleReportDownload';
import { getDownloadedReportIds, markReportDownloaded } from './reportDownloadStorage';

export { getDownloadedReportIds } from './reportDownloadStorage';

export interface ReportDownloadResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  message?: string;
}

export async function downloadFarmerReport(report: FarmerReportItem): Promise<ReportDownloadResult> {
  if (report.sourceType === 'final_report' && report.sourceId > 0) {
    return downloadFarmerFinalReportFile(report.sourceId, report.title);
  }

  return {
    success: false,
    message: REPORT_FILE_NOT_GENERATED_MESSAGE,
  };
}

export async function downloadFarmerFinalReport(
  reportId: number,
  reportNumber?: string,
): Promise<ReportDownloadResult> {
  return downloadFarmerFinalReportFile(reportId, reportNumber);
}

export async function downloadAllFarmerReports(reports: FarmerReportItem[]): Promise<ReportDownloadResult> {
  const downloadable = reports.filter((report) => report.downloadAvailable && report.sourceId > 0);

  if (downloadable.length === 0) {
    return { success: false, message: 'There are no reports available to download yet.' };
  }

  let successCount = 0;
  let lastFileName = '';

  for (const report of downloadable) {
    const result = await downloadFarmerReport(report);

    if (result.success) {
      successCount += 1;
      lastFileName = result.fileName ?? lastFileName;
    }
  }

  if (successCount === 0) {
    return { success: false, message: REPORT_FILE_NOT_GENERATED_MESSAGE };
  }

  return {
    success: true,
    fileName: lastFileName,
    message:
      successCount === 1
        ? `${lastFileName} downloaded successfully.`
        : `${successCount} reports downloaded. Use the share sheet to save each file.`,
  };
}

/** @deprecated Internal helper retained for legacy imports — no-op without fake PDF generation. */
export async function openOrSharePdf(fileUri: string, fileName: string): Promise<void> {
  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url: fileUri, title: fileName }
        : { message: `Save ${fileName}`, url: fileUri, title: fileName },
    );
  } catch (error) {
    Alert.alert('Download complete', getApiErrorMessage(error, `${fileName} saved to app storage.`));
  }
}

/** @deprecated Use markReportDownloaded from reportDownloadStorage directly. */
export { markReportDownloaded };
