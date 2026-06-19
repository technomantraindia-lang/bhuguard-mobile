import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { applyLivePhotoWatermark } from '../services/livePhotoWatermarkService';
import { getAuthUser, getAuthUserType } from '../storage/authStorage';
import { resolveCaptureLocation } from './livePhotoLocation';
import {
  buildLivePhotoWatermarkMeta,
  type LivePhotoWatermarkMeta,
} from './livePhotoWatermarkFormat';

export interface LiveCapturedEvidence {
  uri: string;
  name: string;
  type: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string;
  watermark: LivePhotoWatermarkMeta;
}

export type LiveCaptureResult =
  | { ok: true; evidence: LiveCapturedEvidence }
  | { ok: false; cancelled: boolean; error?: string };

export async function captureLivePhotoEvidence(options?: {
  defaultName?: string;
  allowsEditing?: boolean;
}): Promise<LiveCaptureResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    return { ok: false, cancelled: false, error: 'Camera permission is required to capture evidence.' };
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  let accuracy: number | null = null;

  const locationPermission = await Location.requestForegroundPermissionsAsync();

  if (locationPermission.granted) {
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      accuracy = position.coords.accuracy ?? null;
    } catch {
      // Photo can still be captured without GPS.
    }
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.85,
    allowsEditing: options?.allowsEditing ?? true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  const capturedAt = new Date().toISOString();
  const [authUser, authUserType] = await Promise.all([getAuthUser(), getAuthUserType()]);
  const location =
    latitude != null && longitude != null
      ? await resolveCaptureLocation(latitude, longitude)
      : { village: '—', division: '—', state: 'Gujarat' };

  const watermark = buildLivePhotoWatermarkMeta({
    capturedAt,
    latitude,
    longitude,
    village: location.village,
    division: location.division,
    state: location.state,
    userType: authUserType,
    userName: authUser?.name,
  });

  const watermarkedUri = await applyLivePhotoWatermark(asset.uri, watermark);

  return {
    ok: true,
    evidence: {
      uri: watermarkedUri,
      name: asset.fileName ?? options?.defaultName ?? 'live-evidence.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      label: asset.fileName ?? 'Live camera photo',
      latitude,
      longitude,
      accuracy,
      capturedAt,
      watermark,
    },
  };
}

export function buildFormDataFilePart(
  uri: string,
  name: string,
  type: string,
): { uri: string; name: string; type: string } {
  const mimeType = type || 'image/jpeg';
  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const normalizedName = name.includes('.') ? name : `${name}.${extension}`;
  const normalizedUri =
    Platform.OS === 'android'
      ? uri.startsWith('file://') || uri.startsWith('content://')
        ? uri
        : `file://${uri}`
      : uri.replace('file://', '');

  return {
    uri: normalizedUri,
    name: normalizedName,
    type: mimeType,
  };
}

export function appendVisitEvidenceFields(formData: FormData, evidence: LiveCapturedEvidence): void {
  formData.append('file', buildFormDataFilePart(evidence.uri, evidence.name, evidence.type) as unknown as Blob);

  if (evidence.latitude !== null) {
    formData.append('latitude', String(evidence.latitude));
  }

  if (evidence.longitude !== null) {
    formData.append('longitude', String(evidence.longitude));
  }

  if (evidence.accuracy !== null) {
    formData.append('gps_accuracy', String(evidence.accuracy));
  }

  formData.append('captured_at', evidence.capturedAt);
}

export function appendActivityEvidenceFields(formData: FormData, evidence: LiveCapturedEvidence): void {
  formData.append(
    'evidence_photo',
    buildFormDataFilePart(evidence.uri, evidence.name, evidence.type) as unknown as Blob,
  );

  if (evidence.latitude !== null) {
    formData.append('gps_latitude', String(evidence.latitude));
  }

  if (evidence.longitude !== null) {
    formData.append('gps_longitude', String(evidence.longitude));
  }

  if (evidence.accuracy !== null) {
    formData.append('gps_accuracy', String(evidence.accuracy));
  }

  formData.append('captured_at', evidence.capturedAt);
}

export function appendFarmerEvidenceFields(formData: FormData, evidence: LiveCapturedEvidence): void {
  formData.append('file', buildFormDataFilePart(evidence.uri, evidence.name, evidence.type) as unknown as Blob);

  if (evidence.latitude !== null) {
    formData.append('latitude', String(evidence.latitude));
  }

  if (evidence.longitude !== null) {
    formData.append('longitude', String(evidence.longitude));
  }

  if (evidence.accuracy !== null) {
    formData.append('accuracy', String(evidence.accuracy));
  }

  formData.append('captured_at', evidence.capturedAt);
}

export function formatCapturedTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function hasGpsCapture(evidence: LiveCapturedEvidence | null): boolean {
  return evidence?.latitude != null && evidence?.longitude != null;
}
