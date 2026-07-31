import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform, Share } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { downloadBiocharReport } from '../api/fieldOfficerApi';

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

export async function saveAndShareBiocharReport(
  reportId: number | string,
  format: 'pdf' | 'csv',
  fileNameBase = 'biochar-report',
): Promise<{ success: boolean; message?: string }> {
  try {
    const buffer = await downloadBiocharReport(reportId, format);
    const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

    if (!directory) {
      return { success: false, message: 'Unable to access device storage.' };
    }

    const extension = format === 'csv' ? 'csv' : 'txt';
    const fileName = `${fileNameBase}.${extension}`;
    const fileUri = `${directory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, arrayBufferToBase64(buffer), {
      encoding: FileSystem.EncodingType.Base64,
    });

    let shareUri = fileUri;
    if (Platform.OS === 'android' && typeof FileSystem.getContentUriAsync === 'function') {
      try {
        shareUri = await FileSystem.getContentUriAsync(fileUri);
      } catch {
        shareUri = fileUri;
      }
    }

    await Share.share(
      Platform.OS === 'ios'
        ? { url: shareUri, title: fileName }
        : { url: shareUri, message: fileName, title: fileName },
    );

    return { success: true, message: 'Report downloaded successfully.' };
  } catch (err) {
    return { success: false, message: getApiErrorMessage(err, 'Unable to download biochar report.') };
  }
}

export function alertBiocharDownloadResult(result: { success: boolean; message?: string }): void {
  if (!result.success) {
    Alert.alert('Download failed', result.message ?? 'Unable to download this report.');
    return;
  }

  Alert.alert('Success', result.message ?? 'Report downloaded successfully');
}
