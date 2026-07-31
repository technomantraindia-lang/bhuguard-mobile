import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

import {
  applyLivePhotoWatermarkDetailed,
  isDeferredStampUri,
} from '../services/livePhotoWatermarkService';
import { resolveValidatedCaptureLocation } from './livePhotoLocation';
import { buildLivePhotoWatermarkMeta, type LivePhotoWatermarkMeta } from './livePhotoWatermarkFormat';
import { BIOCHAR_POOR_ACCURACY_MESSAGE } from './biocharGpsCapture';
import { compressEvidenceImage } from './compressEvidenceImage';
import {
  createEvidenceCaptureTimestamp,
  formatEvidenceBadgeLabel,
  parseEvidenceInstant,
  type EvidenceCaptureTimestamp,
} from './evidenceDateTime';
import { MAX_ALLOWED_ACCURACY_METERS } from './locationUtils';
import { captureHighAccuracyGps } from './officerGpsCapture';

export interface LiveCapturedEvidence {
  uri: string;
  previewUri: string;
  name: string;
  type: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  /** Canonical UTC ISO instant — immutable after capture */
  capturedAt: string;
  /** Local ISO with offset at capture */
  capturedAtLocal?: string;
  timezone?: string;
  utcOffsetMinutes?: number;
  captureSource?: EvidenceCaptureTimestamp['captureSource'];
  village: string;
  taluka: string;
  district: string;
  state: string;
  watermark: LivePhotoWatermarkMeta;
  /** False when stamp will be applied by the server on upload. */
  preStamped?: boolean;
}

export type LiveCaptureResult =
  | { ok: true; evidence: LiveCapturedEvidence }
  | { ok: false; cancelled: boolean; error?: string };

/** Live evidence must always use the rear camera — never front/selfie. */
export const LIVE_EVIDENCE_CAMERA_TYPE = ImagePicker.CameraType.back;

export function liveEvidenceCameraOptions(
  overrides: ImagePicker.ImagePickerOptions = {},
): ImagePicker.ImagePickerOptions {
  return {
    cameraType: LIVE_EVIDENCE_CAMERA_TYPE,
    ...overrides,
  };
}

export async function captureLivePhotoEvidence(options?: {
  defaultName?: string;
  allowsEditing?: boolean;
}): Promise<LiveCaptureResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    return { ok: false, cancelled: false, error: 'Camera permission is required to capture evidence.' };
  }

  const locationPermission = await Location.requestForegroundPermissionsAsync();

  if (!locationPermission.granted) {
    return { ok: false, cancelled: false, error: 'GPS permission is required to stamp evidence photos.' };
  }

  // Start GPS while the user is aiming/taking the photo — major capture speedup.
  const gpsPromise = captureHighAccuracyGps({
    timeoutMs: 12000,
    maxAttempts: 3,
    targetAccuracyM: 50,
  }).catch((error: unknown) => {
    throw error instanceof Error
      ? error
      : new Error('Unable to capture GPS location for evidence stamp.');
  });

  const result = await ImagePicker.launchCameraAsync(
    liveEvidenceCameraOptions({
      quality: 0.7,
      allowsEditing: options?.allowsEditing ?? false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    }),
  );

  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  let accuracy: number | null = null;

  try {
    const position = await gpsPromise;
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

  // Hard-block only when accuracy is unusable. Typical Android readings of 30–80 m
  // should still allow stamped capture so Biochar Process is not stuck outdoors/indoors.
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy > MAX_ALLOWED_ACCURACY_METERS) {
    return {
      ok: false,
      cancelled: false,
      error: BIOCHAR_POOR_ACCURACY_MESSAGE,
    };
  }

  const asset = result.assets[0];
  const timestamp = createEvidenceCaptureTimestamp({ captureSource: 'live_camera' });
  const location =
    latitude != null && longitude != null
      ? await resolveValidatedCaptureLocation(latitude, longitude)
      : { village: '', taluka: '', district: '', state: 'Gujarat', resolved: false };

  const watermark = buildLivePhotoWatermarkMeta({
    capturedAt: timestamp.capturedAtUtc,
    timestamp,
    latitude,
    longitude,
    accuracy,
    village: location.village || '-',
    taluka: location.taluka || '-',
    district: location.district || '-',
    state: location.state || 'Gujarat',
  });

  // Compress early so preview + stamp + upload stay fast (URI only, never base64).
  const compressedUri = await compressEvidenceImage(asset.uri, {
    maxWidth: 1280,
    quality: 0.7,
  });
  const rawUri = compressedUri;

  let stampResult: { uri: string; preStamped: boolean };

  try {
    stampResult = await applyLivePhotoWatermarkDetailed(rawUri, watermark, {
      uri: rawUri,
      name: asset.fileName ?? options?.defaultName ?? 'live-evidence.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      capturedAt: timestamp.capturedAtUtc,
      capturedAtLocal: timestamp.capturedAtLocal,
      timezone: timestamp.timezone,
      utcOffsetMinutes: timestamp.utcOffsetMinutes,
      stampLabel: timestamp.stampLabel,
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

  if (stampResult.uri === rawUri && !isDeferredStampUri(stampResult.uri)) {
    return {
      ok: false,
      cancelled: false,
      error: 'Evidence stamp could not be applied. Please restart the app and try again.',
    };
  }

  return {
    ok: true,
    evidence: {
      uri: stampResult.uri,
      // Show compressed/stamped URI immediately — never wait on a second pass.
      previewUri: stampResult.uri || compressedUri,
      name: asset.fileName ?? options?.defaultName ?? 'live-evidence.jpg',
      type: 'image/jpeg',
      label: asset.fileName ?? 'Live camera photo',
      latitude,
      longitude,
      accuracy,
      capturedAt: timestamp.capturedAtUtc,
      capturedAtLocal: timestamp.capturedAtLocal,
      timezone: timestamp.timezone,
      utcOffsetMinutes: timestamp.utcOffsetMinutes,
      captureSource: timestamp.captureSource,
      village: location.village || '',
      taluka: location.taluka || '',
      district: location.district || '',
      state: location.state || 'Gujarat',
      watermark,
      preStamped: stampResult.preStamped,
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

  const locationPermission = await Location.requestForegroundPermissionsAsync();

  if (!locationPermission.granted) {
    return { ok: false, cancelled: false, error: 'GPS permission is required to stamp uploaded evidence photos.' };
  }

  const gpsPromise = captureHighAccuracyGps({
    timeoutMs: 12000,
    maxAttempts: 3,
    targetAccuracyM: 50,
  });

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.7,
    allowsEditing: options?.allowsEditing ?? false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  let latitude: number | null = null;
  let longitude: number | null = null;
  let accuracy: number | null = null;

  try {
    const position = await gpsPromise;
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

  if (accuracy == null || !Number.isFinite(accuracy) || accuracy > MAX_ALLOWED_ACCURACY_METERS) {
    return {
      ok: false,
      cancelled: false,
      error: BIOCHAR_POOR_ACCURACY_MESSAGE,
    };
  }

  const asset = result.assets[0];
  const compressedUri = await compressEvidenceImage(asset.uri, {
    maxWidth: 1280,
    quality: 0.7,
  });
  const exifTimestamp = extractGalleryExifEpoch(asset);
  const timestamp = createEvidenceCaptureTimestamp({
    epochMilliseconds: exifTimestamp ?? Date.now(),
    captureSource: exifTimestamp != null ? 'gallery_exif' : 'gallery_selected',
  });
  const location =
    latitude != null && longitude != null
      ? await resolveValidatedCaptureLocation(latitude, longitude)
      : { village: '', taluka: '', district: '', state: 'Gujarat', resolved: false };

  const watermark = buildLivePhotoWatermarkMeta({
    capturedAt: timestamp.capturedAtUtc,
    timestamp,
    latitude,
    longitude,
    accuracy,
    village: location.village || '-',
    taluka: location.taluka || '-',
    district: location.district || '-',
    state: location.state || 'Gujarat',
  });

  try {
    const stampResult = await applyLivePhotoWatermarkDetailed(compressedUri, watermark, {
      uri: compressedUri,
      name: asset.fileName ?? options?.defaultName ?? 'uploaded-evidence.jpg',
      type: 'image/jpeg',
      capturedAt: timestamp.capturedAtUtc,
      capturedAtLocal: timestamp.capturedAtLocal,
      timezone: timestamp.timezone,
      utcOffsetMinutes: timestamp.utcOffsetMinutes,
      stampLabel: timestamp.stampLabel,
      latitude,
      longitude,
      accuracy,
      village: location.village,
      taluka: location.taluka,
      district: location.district,
      state: location.state,
    });

    if (stampResult.uri === compressedUri && !isDeferredStampUri(stampResult.uri)) {
      return {
        ok: false,
        cancelled: false,
        error: 'Evidence stamp could not be applied. Please restart the app and try again.',
      };
    }

    return {
      ok: true,
      evidence: {
        uri: stampResult.uri,
        previewUri: stampResult.uri,
        name: asset.fileName ?? options?.defaultName ?? 'uploaded-evidence.jpg',
        type: 'image/jpeg',
        label: asset.fileName ?? 'Uploaded photo',
        latitude,
        longitude,
        accuracy,
        capturedAt: timestamp.capturedAtUtc,
        capturedAtLocal: timestamp.capturedAtLocal,
        timezone: timestamp.timezone,
        utcOffsetMinutes: timestamp.utcOffsetMinutes,
        captureSource: timestamp.captureSource,
        village: location.village || '',
        taluka: location.taluka || '',
        district: location.district || '',
        state: location.state || 'Gujarat',
        watermark,
        preStamped: stampResult.preStamped,
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

function extractGalleryExifEpoch(asset: ImagePicker.ImagePickerAsset): number | null {
  const exif = (asset.exif ?? null) as Record<string, unknown> | null;

  if (!exif) {
    return null;
  }

  const candidates = [
    exif.DateTimeOriginal,
    exif.DateTimeDigitized,
    exif.DateTime,
    exif.GPSDateStamp,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate.trim()) {
      continue;
    }

    // EXIF often uses "YYYY:MM:DD HH:mm:ss"
    const normalized = candidate.includes('T')
      ? candidate
      : candidate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const epoch = parseEvidenceInstant(normalized);

    if (Number.isFinite(epoch) && epoch > 0) {
      const ageMs = Date.now() - epoch;

      // Reject clearly invalid future/past EXIF clocks.
      if (ageMs > -5 * 60_000 && ageMs < 1000 * 60 * 60 * 24 * 365 * 20) {
        return epoch;
      }
    }
  }

  return null;
}

export function appendClientStampMetadata(
  formData: FormData,
  evidence: Pick<
    LiveCapturedEvidence,
    | 'capturedAt'
    | 'capturedAtLocal'
    | 'timezone'
    | 'utcOffsetMinutes'
    | 'captureSource'
    | 'latitude'
    | 'longitude'
    | 'accuracy'
    | 'village'
    | 'taluka'
    | 'district'
    | 'state'
  > & {
    watermark?: Pick<LivePhotoWatermarkMeta, 'capturedAtLabel'>;
  },
): void {
  formData.append('client_pre_stamped', '1');
  formData.append('captured_at', evidence.capturedAt);

  if (evidence.capturedAtLocal) {
    formData.append('captured_at_local', evidence.capturedAtLocal);
  }

  if (evidence.timezone) {
    formData.append('timezone', evidence.timezone);
    formData.append('captured_timezone', evidence.timezone);
  }

  if (evidence.utcOffsetMinutes != null) {
    formData.append('utc_offset_minutes', String(evidence.utcOffsetMinutes));
    formData.append('captured_utc_offset_minutes', String(evidence.utcOffsetMinutes));
  }

  if (evidence.captureSource) {
    formData.append('capture_source', evidence.captureSource);
  }

  if (evidence.watermark?.capturedAtLabel) {
    formData.append('stamp_captured_at_label', evidence.watermark.capturedAtLabel);
  }

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

  if (evidence.village.trim()) {
    formData.append('village_name', evidence.village.trim());
    formData.append('village', evidence.village.trim());
  }

  if (evidence.taluka.trim()) {
    formData.append('taluka_name', evidence.taluka.trim());
    formData.append('taluka', evidence.taluka.trim());
  }

  if (evidence.district.trim()) {
    formData.append('district_name', evidence.district.trim());
    formData.append('district', evidence.district.trim());
  }

  if (evidence.state.trim()) {
    formData.append('state_name', evidence.state.trim());
    formData.append('state', evidence.state.trim());
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
  return formatEvidenceBadgeLabel(parseEvidenceInstant(iso));
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
