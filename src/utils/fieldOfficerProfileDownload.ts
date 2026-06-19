import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Platform, Share } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import { apiClient } from '../api/client';

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

async function savePdfBuffer(buffer: ArrayBuffer, fileName: string): Promise<string> {
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Unable to access device storage for PDF download.');
  }

  const fileUri = `${directory}${fileName}`;
  const base64 = arrayBufferToBase64(buffer);

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

export async function downloadFieldOfficerAppointmentLetter(
  fileName = 'appointment-letter.pdf',
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.get('/field-officer/profile/documents/appointment-letter/download', {
      responseType: 'arraybuffer',
      headers: {
        Accept: 'application/pdf, application/json',
      },
    });

    const contentType = String(response.headers['content-type'] ?? '');

    if (contentType.includes('application/json') || !isPdfBuffer(response.data as ArrayBuffer)) {
      return { success: false, message: 'Appointment letter is not available yet.' };
    }

    const fileUri = await savePdfBuffer(response.data as ArrayBuffer, fileName);
    await openOrSharePdf(fileUri, fileName);

    return { success: true, message: 'Appointment letter downloaded successfully.' };
  } catch (error) {
    return {
      success: false,
      message: getApiErrorMessage(error, 'Unable to download appointment letter right now.'),
    };
  }
}
