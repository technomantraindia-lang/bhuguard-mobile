import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform, Share } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { apiClient } from '../api/client';
import { getAuthUser } from '../storage/authStorage';
import type { FarmerReportItem } from './farmerReportHelpers';
import { buildFarmerReportPdfBytes, sanitizePdfFileName } from './reportPdfGenerator';
import { markReportDownloaded } from './reportDownloadStorage';

export { getDownloadedReportIds } from './reportDownloadStorage';

export interface ReportDownloadResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  message?: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(binary);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let offset = 0;

  while (offset < binary.length) {
    const a = binary.charCodeAt(offset++);
    const b = offset < binary.length ? binary.charCodeAt(offset++) : 0;
    const c = offset < binary.length ? binary.charCodeAt(offset++) : 0;
    const bitmap = (a << 16) | (b << 8) | c;

    result +=
      chars.charAt((bitmap >> 18) & 63) +
      chars.charAt((bitmap >> 12) & 63) +
      chars.charAt(offset - 2 < binary.length ? (bitmap >> 6) & 63 : 64) +
      chars.charAt(offset - 1 < binary.length ? bitmap & 63 : 64);
  }

  return result;
}

function isPdfBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  const header = new Uint8Array(buffer.slice(0, 4));
  const signature = String.fromCharCode(header[0], header[1], header[2], header[3]);

  return signature === '%PDF';
}

async function savePdfBuffer(buffer: ArrayBuffer | Uint8Array, fileName: string): Promise<string> {
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Unable to access device storage for PDF download.');
  }

  const fileUri = `${directory}${fileName}`;
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const base64 = arrayBufferToBase64(bytes.buffer as ArrayBuffer);

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

async function openOrSharePdf(fileUri: string, fileName: string): Promise<void> {
  let shareUri = fileUri;

  if (Platform.OS === 'android' && typeof FileSystem.getContentUriAsync === 'function') {
    try {
      shareUri = await FileSystem.getContentUriAsync(fileUri);
    } catch {
      shareUri = fileUri;
    }
  }

  try {
    const result = await Share.share(
      Platform.OS === 'ios'
        ? { url: shareUri, title: fileName }
        : { message: `Save ${fileName}`, url: shareUri, title: fileName },
    );

    if (result.action === Share.dismissedAction) {
      Alert.alert('Download complete', `${fileName} saved. Open your file manager or share again to view it.`);
    }
  } catch {
    Alert.alert('Download complete', `${fileName} saved to app storage on your device.`);
  }
}

async function generateLocalReportPdf(report: FarmerReportItem): Promise<ReportDownloadResult> {
  const user = await getAuthUser();
  const fileName = sanitizePdfFileName(report.title);
  const pdfBytes = buildFarmerReportPdfBytes(report, user?.name ?? 'Farmer');
  const fileUri = await savePdfBuffer(pdfBytes, fileName);

  await openOrSharePdf(fileUri, fileName);
  await markReportDownloaded(report.id);

  return {
    success: true,
    fileUri,
    fileName,
    message: `${fileName} is ready to save or open.`,
  };
}

async function downloadFinalReportFromApi(reportId: number, fileName: string): Promise<ReportDownloadResult | null> {
  try {
    const response = await apiClient.get(`/farmer/final-reports/${reportId}/download`, {
      responseType: 'arraybuffer',
      headers: {
        Accept: 'application/pdf, application/json',
      },
    });

    const contentType = String(response.headers['content-type'] ?? '');

    if (contentType.includes('application/json') || !isPdfBuffer(response.data as ArrayBuffer)) {
      return null;
    }

    const fileUri = await savePdfBuffer(response.data as ArrayBuffer, fileName);

    await openOrSharePdf(fileUri, fileName);
    await markReportDownloaded(`final-${reportId}`);

    return {
      success: true,
      fileUri,
      fileName,
      message: `${fileName} downloaded from Bhuguard.`,
    };
  } catch {
    return null;
  }
}

export async function downloadFarmerReport(report: FarmerReportItem): Promise<ReportDownloadResult> {
  const fileName = sanitizePdfFileName(report.title);

  try {
    if (report.sourceType === 'final_report' && report.sourceId > 0) {
      const apiResult = await downloadFinalReportFromApi(report.sourceId, fileName);

      if (apiResult?.success) {
        return apiResult;
      }
    }

    return await generateLocalReportPdf(report);
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Unable to download this report right now.'),
    };
  }
}

export async function downloadFarmerFinalReport(reportId: number, reportNumber?: string): Promise<ReportDownloadResult> {
  return downloadFarmerReport({
    id: `final-${reportId}`,
    catalogId: 'final',
    sourceType: 'final_report',
    sourceId: reportId,
    title: reportNumber ?? `Final Report ${reportId}`,
    description: 'Official generated farm report',
    updatedLabel: 'Updated: —',
    updatedAt: null,
    statusBadge: 'available',
    icon: 'assignment',
    downloadAvailable: true,
  });
}

export async function downloadAllFarmerReports(reports: FarmerReportItem[]): Promise<ReportDownloadResult> {
  if (reports.length === 0) {
    return { success: false, message: 'There are no reports available to download yet.' };
  }

  let successCount = 0;
  let lastFileName = '';

  for (const report of reports) {
    const result = await downloadFarmerReport(report);

    if (result.success) {
      successCount += 1;
      lastFileName = result.fileName ?? lastFileName;
    }
  }

  if (successCount === 0) {
    return { success: false, message: 'Unable to download reports right now. Please try again.' };
  }

  return {
    success: true,
    fileName: lastFileName,
    message:
      successCount === 1
        ? `${lastFileName} downloaded successfully.`
        : `${successCount} reports downloaded. Use the share sheet to save each PDF.`,
  };
}
