import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { apiClient } from './client';
import { buildFormDataFilePart } from '../utils/liveEvidenceCapture';

interface StampImageResponse {
  success?: boolean;
  data?: {
    stamped_image_base64?: string;
    mime_type?: string;
  };
  stamped_image_base64?: string;
}

export interface ClientStampImageInput {
  uri: string;
  name: string;
  type: string;
  capturedAt: string;
  capturedAtLocal?: string;
  timezone?: string;
  utcOffsetMinutes?: number;
  stampLabel?: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
}

export async function stampImageOnServer(input: ClientStampImageInput): Promise<string> {
  const formData = new FormData();
  const safeName = input.name.includes('.') ? input.name : `${input.name || 'live-evidence'}.jpg`;
  const safeType = input.type && input.type.startsWith('image/') ? input.type : 'image/jpeg';

  formData.append(
    'image',
    buildFormDataFilePart(input.uri, safeName, safeType) as unknown as Blob,
  );
  formData.append('captured_at', input.capturedAt);

  if (input.capturedAtLocal) {
    formData.append('captured_at_local', input.capturedAtLocal);
  }

  if (input.timezone) {
    formData.append('timezone', input.timezone);
    formData.append('captured_timezone', input.timezone);
  }

  if (input.utcOffsetMinutes != null) {
    formData.append('utc_offset_minutes', String(input.utcOffsetMinutes));
    formData.append('captured_utc_offset_minutes', String(input.utcOffsetMinutes));
  }

  if (input.stampLabel) {
    formData.append('stamp_captured_at_label', input.stampLabel);
  }

  if (input.latitude != null) {
    formData.append('latitude', String(input.latitude));
    formData.append('gps_latitude', String(input.latitude));
  }

  if (input.longitude != null) {
    formData.append('longitude', String(input.longitude));
    formData.append('gps_longitude', String(input.longitude));
  }

  if (input.accuracy != null) {
    formData.append('gps_accuracy', String(input.accuracy));
    formData.append('accuracy', String(input.accuracy));
  }

  if (input.village) {
    formData.append('village', input.village);
  }

  if (input.taluka) {
    formData.append('taluka', input.taluka);
  }

  if (input.district) {
    formData.append('district', input.district);
  }

  if (input.state) {
    formData.append('state', input.state);
  }

  const response = await apiClient.post<StampImageResponse>('/mobile/stamp-image', formData, {
    timeout: 60000,
  });

  const base64 =
    response.data?.data?.stamped_image_base64 ?? response.data?.stamped_image_base64 ?? null;

  if (!base64) {
    throw new Error('Server did not return a stamped image.');
  }

  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Unable to save stamped image on this device.');
  }

  const stampDir = `${directory}BhuguardDrafts/stamped/`;
  await FileSystem.makeDirectoryAsync(stampDir, { intermediates: true });
  const targetPath = `${stampDir}stamped-${Date.now()}.jpg`;
  await FileSystem.writeAsStringAsync(targetPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (Platform.OS === 'android' && !targetPath.startsWith('file://')) {
    return `file://${targetPath}`;
  }

  return targetPath;
}
