import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { applyLivePhotoWatermark } from '../services/livePhotoWatermarkService';
import { resolveCaptureLocation } from './livePhotoLocation';
import { buildLivePhotoWatermarkMeta, type LivePhotoWatermarkMeta } from './livePhotoWatermarkFormat';
import { getCurrentLocationDetailed, MAX_ALLOWED_ACCURACY_METERS } from './locationUtils';

export interface LiveCapturedEvidence {
  uri: string;
  previewUri: string;
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

  if (!locationPermission.granted) {
    return { ok: false, cancelled: false, error: 'GPS permission is required to stamp evidence photos.' };
  }

  try {
    const position = await getCurrentLocationDetailed();
    latitude = position.latitude;
    longitude = position.longitude;
    accuracy = position.accuracyM;
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      error: error instanceof Error ? error.message : 'Unable to capture GPS location for evidence stamp.',
    };
  }

  if (accuracy == null || accuracy > MAX_ALLOWED_ACCURACY_METERS) {
    return {
      ok: false,
      cancelled: false,
      error: `GPS accuracy must be ${MAX_ALLOWED_ACCURACY_METERS}m or better before capturing evidence.`,
    };
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.75,
    allowsEditing: options?.allowsEditing ?? false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  const capturedAt = new Date().toISOString();
  const location =
    latitude != null && longitude != null
      ? await resolveCaptureLocation(latitude, longitude)
      : { village: '—', taluka: '—', district: '—', state: 'Gujarat' };

  const watermark = buildLivePhotoWatermarkMeta({
    capturedAt,
    latitude,
    longitude,
    accuracy,
    village: location.village,
    taluka: location.taluka,
    district: location.district,
    state: location.state,
  });

  const rawUri = asset.uri;

  let stampedUri: string;

  try {
    stampedUri = await applyLivePhotoWatermark(rawUri, watermark, {
      uri: rawUri,
      name: asset.fileName ?? options?.defaultName ?? 'live-evidence.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      capturedAt,
      latitude,
      longitude,
      accuracy,
      village: location.village,
      taluka: location.taluka,
      district: location.district,
      state: location.state,
    });
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      error: error instanceof Error ? error.message : 'Failed to burn timestamp onto the captured photo.',
    };
  }

  if (stampedUri === rawUri) {
    return {
      ok: false,
      cancelled: false,
      error: 'Evidence stamp could not be applied. Please restart the app and try again.',
    };
  }

  return {
    ok: true,
    evidence: {
      uri: stampedUri,
      previewUri: stampedUri,
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

export async function pickStampedPhotoEvidence(options?: {
  defaultName?: string;
  allowsEditing?: boolean;
}): Promise<LiveCaptureResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return { ok: false, cancelled: false, error: 'Photo library permission is required to upload evidence.' };
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  let accuracy: number | null = null;

  const locationPermission = await Location.requestForegroundPermissionsAsync();

  if (!locationPermission.granted) {
    return { ok: false, cancelled: false, error: 'GPS permission is required to stamp uploaded evidence photos.' };
  }

  try {
    const position = await getCurrentLocationDetailed();
    latitude = position.latitude;
    longitude = position.longitude;
    accuracy = position.accuracyM;
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      error: error instanceof Error ? error.message : 'Unable to capture GPS location for evidence stamp.',
    };
  }

  if (accuracy == null || accuracy > MAX_ALLOWED_ACCURACY_METERS) {
    return {
      ok: false,
      cancelled: false,
      error: `GPS accuracy must be ${MAX_ALLOWED_ACCURACY_METERS}m or better before uploading evidence.`,
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.75,
    allowsEditing: options?.allowsEditing ?? false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  const capturedAt = new Date().toISOString();
  const location =
    latitude != null && longitude != null
      ? await resolveCaptureLocation(latitude, longitude)
      : { village: 'Not Available', taluka: 'Not Available', district: 'Not Available', state: 'Gujarat' };

  const watermark = buildLivePhotoWatermarkMeta({
    capturedAt,
    latitude,
    longitude,
    accuracy,
    village: location.village,
    taluka: location.taluka,
    district: location.district,
    state: location.state,
  });

  try {
    const stampedUri = await applyLivePhotoWatermark(asset.uri, watermark, {
      uri: asset.uri,
      name: asset.fileName ?? options?.defaultName ?? 'uploaded-evidence.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      capturedAt,
      latitude,
      longitude,
      accuracy,
      village: location.village,
      taluka: location.taluka,
      district: location.district,
      state: location.state,
    });

    if (stampedUri === asset.uri) {
      return {
        ok: false,
        cancelled: false,
        error: 'Evidence stamp could not be applied. Please restart the app and try again.',
      };
    }

    return {
      ok: true,
      evidence: {
        uri: stampedUri,
        previewUri: stampedUri,
        name: asset.fileName ?? options?.defaultName ?? 'uploaded-evidence.jpg',
        type: asset.mimeType ?? 'image/jpeg',
        label: asset.fileName ?? 'Uploaded photo',
        latitude,
        longitude,
        accuracy,
        capturedAt,
        watermark,
      },
    };
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      error: error instanceof Error ? error.message : 'Failed to burn timestamp onto the selected photo.',
    };
  }
}

export async function captureStampedPhotoUri(options?: {
  defaultName?: string;
  allowsEditing?: boolean;
}): Promise<{ uri: string; name: string; type: string; capturedAt: string } | null> {
  const result = await captureLivePhotoEvidence(options);

  if (!result.ok) {
    return null;
  }

  return {
    uri: result.evidence.uri,
    name: result.evidence.name,
    type: result.evidence.type,
    capturedAt: result.evidence.capturedAt,
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

export function appendClientStampMetadata(
  formData: FormData,
  evidence: Pick<LiveCapturedEvidence, 'capturedAt' | 'latitude' | 'longitude' | 'accuracy'>,
): void {
  formData.append('client_pre_stamped', '1');
  formData.append('captured_at', evidence.capturedAt);

  if (evidence.latitude !== null) {
    formData.append('latitude', String(evidence.latitude));
    formData.append('gps_latitude', String(evidence.latitude));
  }

  if (evidence.longitude !== null) {
    formData.append('longitude', String(evidence.longitude));
    formData.append('gps_longitude', String(evidence.longitude));
  }

  if (evidence.accuracy !== null) {
    formData.append('gps_accuracy', String(evidence.accuracy));
    formData.append('accuracy', String(evidence.accuracy));
  }
}

export function appendVisitEvidenceFields(formData: FormData, evidence: LiveCapturedEvidence): void {
  formData.append(
    'file',
    buildFormDataFilePart(evidence.uri, evidence.name, evidence.type) as unknown as Blob,
  );
  appendClientStampMetadata(formData, evidence);
}

export function appendActivityEvidenceFields(formData: FormData, evidence: LiveCapturedEvidence): void {
  formData.append(
    'evidence_photo',
    buildFormDataFilePart(evidence.uri, evidence.name, evidence.type) as unknown as Blob,
  );
  appendClientStampMetadata(formData, evidence);
}

export function appendFarmerEvidenceFields(formData: FormData, evidence: LiveCapturedEvidence): void {
  formData.append(
    'file',
    buildFormDataFilePart(evidence.uri, evidence.name, evidence.type) as unknown as Blob,
  );
  appendClientStampMetadata(formData, evidence);
}

export function formatCapturedTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function hasGpsCapture(evidence: LiveCapturedEvidence | null): boolean {
  return evidence?.latitude != null && evidence?.longitude != null;
}

const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export async function pickDocumentForEvidence(): Promise<{
  uri: string;
  name: string;
  type: string;
} | null> {
  try {
    const DocumentPicker = await import('expo-document-picker');
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ALLOWED_DOCUMENT_MIMES,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];

    return {
      uri: asset.uri,
      name: asset.name ?? 'document.pdf',
      type: asset.mimeType ?? 'application/pdf',
    };
  } catch {
    throw new Error(
      'Document picker is unavailable. Install with: npx expo install expo-document-picker',
    );
  }
}
