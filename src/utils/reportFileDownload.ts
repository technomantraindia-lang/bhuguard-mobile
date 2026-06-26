import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform, Share } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  downloadReport,
  extensionForReportFormat,
  type ReportDownloadFormat,
  type ReportRole,
} from '../api/reportsApi';
import {
  isApiNotFound,
  isForbiddenError,
  isUnauthorizedError,
  REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE,
} from './apiError';
import { markReportDownloaded } from './reportDownloadStorage';

export const REPORT_FILE_NOT_GENERATED_MESSAGE = 'Report file is not generated yet. Please try later.';

export interface ReportFileDownloadResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  message?: string;
}

export interface ReportFileDownloadOptions {
  role: ReportRole;
  reportId: number | string;
  format?: ReportDownloadFormat;
  fileNameBase?: string;
  downloadKey?: string;
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

function sanitizeFileName(value: string): string {
  const cleaned = value.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  return cleaned.length > 0 ? cleaned : 'report';
}

function tryParseJsonBuffer(buffer: ArrayBuffer): Record<string, unknown> | null {
  try {
    const text = new TextDecoder().decode(buffer).trim();

    if (!text.startsWith('{') && !text.startsWith('[')) {
      return null;
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function isPdfBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) {
    return false;
  }

  const header = new Uint8Array(buffer.slice(0, 4));
  const signature = String.fromCharCode(header[0], header[1], header[2], header[3]);

  return signature === '%PDF';
}

function isZipBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 2) {
    return false;
  }

  const header = new Uint8Array(buffer.slice(0, 2));

  return header[0] === 0x50 && header[1] === 0x4b;
}

function isFileBuffer(buffer: ArrayBuffer, format: ReportDownloadFormat): boolean {
  if (format === 'pdf') {
    return isPdfBuffer(buffer);
  }

  return isZipBuffer(buffer);
}

function resolveJsonDownloadMessage(payload: Record<string, unknown> | null): string | null {
  if (!payload) {
    return null;
  }

  if (payload.success === false) {
    return String(payload.message ?? REPORT_FILE_NOT_GENERATED_MESSAGE);
  }

  const data = payload.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;

    if (record.download_available === false) {
      return REPORT_FILE_NOT_GENERATED_MESSAGE;
    }
  }

  if (payload.download_available === false) {
    return REPORT_FILE_NOT_GENERATED_MESSAGE;
  }

  if (typeof payload.message === 'string' && /not available|not generated|will be available/i.test(payload.message)) {
    return REPORT_FILE_NOT_GENERATED_MESSAGE;
  }

  return null;
}

async function saveFileBuffer(buffer: ArrayBuffer, fileName: string): Promise<string> {
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Unable to access device storage for report download.');
  }

  const fileUri = `${directory}${fileName}`;
  const base64 = arrayBufferToBase64(buffer);

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}

async function openOrShareFile(fileUri: string, fileName: string): Promise<void> {
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

export async function downloadReportFile(
  options: ReportFileDownloadOptions,
): Promise<ReportFileDownloadResult> {
  const format = options.format ?? 'pdf';
  const extension = extensionForReportFormat(format);
  const fileName = `${sanitizeFileName(options.fileNameBase ?? `report-${options.reportId}`)}.${extension}`;

  try {
    const response = await downloadReport(options.role, options.reportId, format);
    const buffer = response.data as ArrayBuffer;
    const contentType = String(response.headers['content-type'] ?? '');

    if (contentType.includes('application/json') || !isFileBuffer(buffer, format)) {
      const jsonPayload = tryParseJsonBuffer(buffer);
      const jsonMessage = resolveJsonDownloadMessage(jsonPayload);

      return {
        success: false,
        message: jsonMessage ?? REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE,
      };
    }

    const fileUri = await saveFileBuffer(buffer, fileName);
    await openOrShareFile(fileUri, fileName);

    if (options.downloadKey) {
      await markReportDownloaded(options.downloadKey);
    }

    return {
      success: true,
      fileUri,
      fileName,
      message: `${fileName} downloaded successfully.`,
    };
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return {
        success: false,
        message: 'Session expired. Please log in again.',
      };
    }

    if (isForbiddenError(error)) {
      return {
        success: false,
        message: 'You do not have permission to download this report.',
      };
    }

    if (isApiNotFound(error)) {
      return {
        success: false,
        message: REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE,
      };
    }

    return {
      success: false,
      message: getApiErrorMessage(error, REPORT_DOWNLOAD_UNAVAILABLE_MESSAGE),
    };
  }
}
