import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform, Share } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { getCachedApiBaseUrl } from '../storage/apiConfigStorage';
import { getAuthToken } from '../utils/authStorage';
import type { ApiRecord } from './apiHelpers';
import { pickString } from './apiHelpers';
import { isJpegBuffer } from './evidencePdfGenerator';

export type EvidenceDownloadRole = 'farmer' | 'company_user';

export interface EvidenceFileResult {
  success: boolean;
  fileUri?: string;
  fileName?: string;
  buffer?: ArrayBuffer;
  message?: string;
}

function arrayBufferToBase64(bytes: Uint8Array): string {
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

  return cleaned.length > 0 ? cleaned : 'evidence';
}

function tryParseJsonText(text: string): Record<string, unknown> | null {
  try {
    const trimmed = text.trim();

    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return null;
    }

    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function resolveJsonErrorMessage(payload: Record<string, unknown> | null): string | null {
  if (!payload) {
    return null;
  }

  if (payload.success === false && typeof payload.message === 'string') {
    return payload.message;
  }

  return null;
}

function extensionForBuffer(buffer: ArrayBuffer, fileName: string, mimeType?: string): string {
  if (fileName.includes('.')) {
    return fileName.split('.').pop()?.toLowerCase() ?? 'bin';
  }

  const bytes = new Uint8Array(buffer);

  if (isJpegBuffer(bytes)) {
    return 'jpg';
  }

  if (bytes.length > 3 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf';
  }

  if (mimeType?.includes('pdf')) {
    return 'pdf';
  }

  if (mimeType?.includes('png')) {
    return 'png';
  }

  if (mimeType?.includes('jpeg') || mimeType?.includes('jpg')) {
    return 'jpg';
  }

  return 'bin';
}

export function evidenceDownloadUrl(role: EvidenceDownloadRole, evidenceId: number | string): string {
  const base = getCachedApiBaseUrl().replace(/\/$/, '');

  return `${base}/${role === 'farmer' ? 'farmer' : 'company'}/evidence/${evidenceId}/download`;
}

export function evidencePdfExportUrl(role: EvidenceDownloadRole, evidenceId: number | string): string {
  const base = getCachedApiBaseUrl().replace(/\/$/, '');

  return `${base}/${role === 'farmer' ? 'farmer' : 'company'}/evidence/${evidenceId}/export-pdf`;
}

function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);

  return bytes.length > 3 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

export function evidenceFileNameFromRecord(item: ApiRecord): string {
  const original = pickString(item, 'original_file_name');

  if (original !== '-') {
    return original;
  }

  const code = pickString(item, 'evidence_code', 'id');

  return `evidence-${code}.jpg`;
}

export function isEvidenceImageMime(mimeType: string | null | undefined): boolean {
  if (!mimeType || mimeType === '-') {
    return true;
  }

  return mimeType.startsWith('image/');
}

async function saveFileBuffer(buffer: ArrayBuffer | Uint8Array, fileName: string): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Unable to access device storage for evidence download.');
  }

  const fileUri = `${directory}${fileName}`;
  const base64 = arrayBufferToBase64(bytes);

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

const cachedEvidenceUris = new Map<string, string>();
const inflightEvidenceDownloads = new Map<string, Promise<string | null>>();

async function fetchAuthenticatedFile(url: string): Promise<EvidenceFileResult> {
  try {
    const token = await getAuthToken();
    const response = await fetch(url, {
      headers: {
        Accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, message: 'Session expired. Please log in again.' };
      }

      if (response.status === 403) {
        return { success: false, message: 'You do not have permission to download this file.' };
      }

      if (response.status === 404) {
        return { success: false, message: 'File is not available.' };
      }

      const errorText = await response.text();
      const jsonMessage = resolveJsonErrorMessage(tryParseJsonText(errorText));

      return {
        success: false,
        message: jsonMessage ?? 'Unable to download file.',
      };
    }

    const contentType = response.headers.get('content-type') ?? '';
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (contentType.includes('application/json') || (bytes.length > 0 && bytes[0] === 0x7b)) {
      const jsonMessage = resolveJsonErrorMessage(tryParseJsonText(new TextDecoder().decode(buffer)));

      return {
        success: false,
        message: jsonMessage ?? 'File is not available.',
      };
    }

    if (bytes.length === 0) {
      return { success: false, message: 'File is empty.' };
    }

    const disposition = response.headers.get('content-disposition') ?? '';
    const dispositionMatch = disposition.match(/filename="?([^";]+)"?/i);
    const headerFileName = dispositionMatch?.[1];

    return {
      success: true,
      buffer,
      fileName: sanitizeFileName(headerFileName ?? 'evidence.jpg'),
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Unable to download file.'),
    };
  }
}

export async function fetchEvidenceFileBuffer(
  role: EvidenceDownloadRole,
  evidenceId: number | string,
): Promise<EvidenceFileResult> {
  return fetchAuthenticatedFile(evidenceDownloadUrl(role, evidenceId));
}

export async function fetchActivityEvidenceFileBuffer(
  activityId: number | string,
): Promise<EvidenceFileResult> {
  return fetchAuthenticatedFile(activityEvidenceDownloadUrl(activityId));
}

export function activityEvidenceDownloadUrl(activityId: number | string): string {
  const base = getCachedApiBaseUrl().replace(/\/$/, '');

  return `${base}/farmer/activity-logs/${activityId}/evidence-photo/download`;
}

export async function fetchEvidencePdfBuffer(
  role: EvidenceDownloadRole,
  evidenceId: number | string,
): Promise<EvidenceFileResult> {
  const result = await fetchAuthenticatedFile(evidencePdfExportUrl(role, evidenceId));

  if (!result.success || !result.buffer) {
    return result;
  }

  if (!isPdfBuffer(result.buffer)) {
    return {
      success: false,
      message: 'Evidence PDF could not be generated. Please try again.',
    };
  }

  const fileName = `bhuguard-evidence-${evidenceId}.pdf`;

  return {
    ...result,
    fileName,
  };
}

export async function cacheEvidenceFileUri(
  role: EvidenceDownloadRole,
  evidenceId: number | string,
  mimeType?: string,
): Promise<string | null> {
  const cacheKey = `${role}:${evidenceId}:v2`;
  const cached = cachedEvidenceUris.get(cacheKey);

  if (cached) {
    return cached;
  }

  const inflight = inflightEvidenceDownloads.get(cacheKey);

  if (inflight) {
    return inflight;
  }

  const downloadPromise = (async () => {
    const fileResult = await fetchEvidenceFileBuffer(role, evidenceId);

    if (!fileResult.success || !fileResult.buffer) {
      if (__DEV__) {
        console.warn('[Bhuguard Evidence] Failed to load evidence file:', fileResult.message);
      }

      return null;
    }

    const extension = extensionForBuffer(fileResult.buffer, fileResult.fileName ?? '', mimeType);
    const fileUri = await saveFileBuffer(
      fileResult.buffer,
      `evidence-${role}-${evidenceId}.${extension}`,
    );

    cachedEvidenceUris.set(cacheKey, fileUri);

    return fileUri;
  })();

  inflightEvidenceDownloads.set(cacheKey, downloadPromise);

  try {
    return await downloadPromise;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Bhuguard Evidence] Cache error:', error);
    }

    return null;
  } finally {
    inflightEvidenceDownloads.delete(cacheKey);
  }
}

const cachedActivityEvidenceUris = new Map<string, string>();
const inflightActivityEvidenceDownloads = new Map<string, Promise<string | null>>();

export async function cacheActivityEvidenceFileUri(activityId: number | string): Promise<string | null> {
  const cacheKey = `activity:${activityId}:v2`;
  const cached = cachedActivityEvidenceUris.get(cacheKey);

  if (cached) {
    return cached;
  }

  const inflight = inflightActivityEvidenceDownloads.get(cacheKey);

  if (inflight) {
    return inflight;
  }

  const downloadPromise = (async () => {
    const fileResult = await fetchActivityEvidenceFileBuffer(activityId);

    if (!fileResult.success || !fileResult.buffer) {
      if (__DEV__) {
        console.warn('[Bhuguard Activity] Failed to load activity evidence photo:', fileResult.message);
      }

      return null;
    }

    const extension = extensionForBuffer(fileResult.buffer, fileResult.fileName ?? '');
    const fileUri = await saveFileBuffer(fileResult.buffer, `activity-evidence-${activityId}.${extension}`);
    cachedActivityEvidenceUris.set(cacheKey, fileUri);

    return fileUri;
  })();

  inflightActivityEvidenceDownloads.set(cacheKey, downloadPromise);

  try {
    return await downloadPromise;
  } finally {
    inflightActivityEvidenceDownloads.delete(cacheKey);
  }
}

export async function downloadActivityEvidenceFile(activityId: number | string): Promise<EvidenceFileResult> {
  const fileResult = await fetchActivityEvidenceFileBuffer(activityId);

  if (!fileResult.success || !fileResult.buffer) {
    return fileResult;
  }

  const extension = extensionForBuffer(fileResult.buffer, fileResult.fileName ?? '');
  const fileName = `activity-evidence-${activityId}.${extension}`;

  try {
    const fileUri = await saveFileBuffer(fileResult.buffer, fileName);
    await openOrShareFile(fileUri, fileName);

    return {
      success: true,
      fileUri,
      fileName,
      buffer: fileResult.buffer,
      message: `${fileName} downloaded successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Unable to save activity evidence file.'),
    };
  }
}

export async function downloadEvidenceFile(
  role: EvidenceDownloadRole,
  evidenceId: number | string,
  fileNameBase?: string,
  mimeType?: string,
): Promise<EvidenceFileResult> {
  const fileResult = await fetchEvidenceFileBuffer(role, evidenceId);

  if (!fileResult.success || !fileResult.buffer) {
    return fileResult;
  }

  const extension = extensionForBuffer(fileResult.buffer, fileResult.fileName ?? '', mimeType);
  const baseName = sanitizeFileName(
    fileNameBase ?? fileResult.fileName?.replace(/\.[^.]+$/, '') ?? `evidence-${evidenceId}`,
  );
  const fileName = baseName.includes('.') ? baseName : `${baseName}.${extension}`;

  try {
    const fileUri = await saveFileBuffer(fileResult.buffer, fileName);
    await openOrShareFile(fileUri, fileName);

    return {
      success: true,
      fileUri,
      fileName,
      buffer: fileResult.buffer,
      message: `${fileName} downloaded successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Unable to save evidence file.'),
    };
  }
}

export async function saveEvidencePdfAndShare(
  pdfBytes: Uint8Array,
  fileName: string,
): Promise<EvidenceFileResult> {
  try {
    const safeName = sanitizeFileName(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    const fileUri = await saveFileBuffer(pdfBytes, safeName);
    await openOrShareFile(fileUri, safeName);

    return {
      success: true,
      fileUri,
      fileName: safeName,
      message: `${safeName} ready to view or share.`,
    };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Unable to save evidence PDF.'),
    };
  }
}
