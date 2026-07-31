import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';

import {
  applyLivePhotoWatermarkDetailed,
  isDeferredStampUri,
} from '../services/livePhotoWatermarkService';
import { BIOCHAR_POOR_ACCURACY_MESSAGE } from './biocharGpsCapture';
import { createEvidenceCaptureTimestamp } from './evidenceDateTime';
import type { LiveCaptureResult } from './liveEvidenceCapture';
import { resolveValidatedCaptureLocation } from './livePhotoLocation';
import { buildLivePhotoWatermarkMeta } from './livePhotoWatermarkFormat';
import { MAX_ALLOWED_ACCURACY_METERS } from './locationUtils';
import { captureHighAccuracyGps } from './officerGpsCapture';
import { loadExpoJsModuleWhenNativeAvailable } from './safeExpoNative';

export interface EndProcessPendingStamp {
  persistentUri: string;
  name: string;
  type: string;
  capturedAt: string;
  capturedAtLocal?: string;
  timezone?: string;
  utcOffsetMinutes?: number;
  stampLabel?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  village: string;
  taluka: string;
  district: string;
  state: string;
}

type ImageManipulatorModule = {
  manipulateAsync: (
    uri: string,
    actions: unknown[],
    options: { compress: number; format: unknown },
  ) => Promise<{ uri: string }>;
  SaveFormat: { JPEG: unknown };
};

function resolveImageManipulator(): ImageManipulatorModule | null {
  return loadExpoJsModuleWhenNativeAvailable('ExpoImageManipulator', () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-image-manipulator') as ImageManipulatorModule,
  );
}

async function assertLocalFileReady(uri: string, label: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists) {
    throw new Error(`${label} was not found on this device. Retake the photo and try again.`);
  }

  const size = 'size' in info && typeof info.size === 'number' ? info.size : 0;

  if (size <= 0) {
    throw new Error(`${label} is empty. Retake the photo and try again.`);
  }

  return size;
}

export async function persistEndProcessSourceImage(params: {
  sourceUri: string;
  draftUuid: string;
}): Promise<string> {
  const root = FileSystem.documentDirectory;

  if (!root) {
    throw new Error('Persistent document storage is unavailable on this device.');
  }

  await assertLocalFileReady(params.sourceUri, 'Captured photo');

  const directory = `${root}biochar-production/${params.draftUuid}/end-pyrolysis/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const destination = `${directory}end-pyrolysis-${Date.now()}.jpg`;

  await FileSystem.copyAsync({
    from: params.sourceUri,
    to: destination,
  });

  await assertLocalFileReady(destination, 'Saved End-Process Image');

  return destination;
}

export async function normalizeEndProcessJpeg(uri: string): Promise<string> {
  const lower = uri.toLowerCase();

  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return uri;
  }

  const ImageManipulator = resolveImageManipulator();
  if (!ImageManipulator) {
    return uri;
  }

  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return result.uri;
}

export async function buildEndProcessPendingStamp(params: {
  persistentUri: string;
  defaultName?: string;
  /** Authoritative shutter time — do not regenerate after GPS/watermark. */
  shutterEpochMs?: number;
}): Promise<EndProcessPendingStamp> {
  const locationPermission = await Location.requestForegroundPermissionsAsync();

  if (!locationPermission.granted) {
    throw new Error('GPS permission is required to stamp the End-Process Image.');
  }

  const position = await captureHighAccuracyGps({
    timeoutMs: 30000,
    maxAttempts: 6,
    targetAccuracyM: 50,
  });

  if (
    position.accuracyM == null ||
    !Number.isFinite(position.accuracyM) ||
    position.accuracyM > MAX_ALLOWED_ACCURACY_METERS
  ) {
    throw new Error(BIOCHAR_POOR_ACCURACY_MESSAGE);
  }

  const timestamp = createEvidenceCaptureTimestamp({
    captureSource: 'live_camera',
    epochMilliseconds: params.shutterEpochMs,
  });
  const location = await resolveValidatedCaptureLocation(position.latitude, position.longitude);

  return {
    persistentUri: params.persistentUri,
    name: params.defaultName ?? 'end_stage_before_quenching_photo.jpg',
    type: 'image/jpeg',
    capturedAt: timestamp.capturedAtUtc,
    capturedAtLocal: timestamp.capturedAtLocal,
    timezone: timestamp.timezone,
    utcOffsetMinutes: timestamp.utcOffsetMinutes,
    stampLabel: timestamp.stampLabel,
    latitude: position.latitude,
    longitude: position.longitude,
    accuracy: position.accuracyM,
    village: location.village || '',
    taluka: location.taluka || '',
    district: location.district || '',
    state: location.state || 'Gujarat',
  };
}

export async function stampEndProcessPending(
  pending: EndProcessPendingStamp,
): Promise<LiveCaptureResult> {
  try {
    await assertLocalFileReady(pending.persistentUri, 'End-Process Image');

    const watermark = buildLivePhotoWatermarkMeta({
      capturedAt: pending.capturedAt,
      latitude: pending.latitude,
      longitude: pending.longitude,
      accuracy: pending.accuracy,
      village: pending.village || '-',
      taluka: pending.taluka || '-',
      district: pending.district || '-',
      state: pending.state || 'Gujarat',
    });

    const stampResult = await applyLivePhotoWatermarkDetailed(pending.persistentUri, watermark, {
      uri: pending.persistentUri,
      name: pending.name,
      type: pending.type,
      capturedAt: pending.capturedAt,
      capturedAtLocal: pending.capturedAtLocal,
      timezone: pending.timezone,
      utcOffsetMinutes: pending.utcOffsetMinutes,
      stampLabel: pending.stampLabel,
      latitude: pending.latitude,
      longitude: pending.longitude,
      accuracy: pending.accuracy,
      village: pending.village,
      taluka: pending.taluka,
      district: pending.district,
      state: pending.state,
    });

    if (
      !stampResult.uri ||
      (stampResult.uri === pending.persistentUri && !isDeferredStampUri(stampResult.uri))
    ) {
      return {
        ok: false,
        cancelled: false,
        error: 'Evidence stamp could not be applied. Use Retry Processing or Retake Photo.',
      };
    }

    await assertLocalFileReady(stampResult.uri, 'Stamped End-Process Image');

    return {
      ok: true,
      evidence: {
        uri: stampResult.uri,
        previewUri: stampResult.uri,
        name: pending.name,
        type: pending.type,
        label: 'End-Process Image',
        latitude: pending.latitude,
        longitude: pending.longitude,
        accuracy: pending.accuracy,
        capturedAt: pending.capturedAt,
        capturedAtLocal: pending.capturedAtLocal,
        timezone: pending.timezone,
        utcOffsetMinutes: pending.utcOffsetMinutes,
        captureSource: 'live_camera',
        village: pending.village,
        taluka: pending.taluka,
        district: pending.district,
        state: pending.state,
        watermark,
        preStamped: stampResult.preStamped,
      },
    };
  } catch (error) {
    return {
      ok: false,
      cancelled: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to burn timestamp onto the End-Process Image.',
    };
  }
}

export async function processEndProcessCameraUri(params: {
  cameraUri: string;
  draftUuid: string;
  defaultName?: string;
  shutterEpochMs?: number;
}): Promise<{ result: LiveCaptureResult; pending: EndProcessPendingStamp | null }> {
  try {
    const persistentUri = await persistEndProcessSourceImage({
      sourceUri: params.cameraUri,
      draftUuid: params.draftUuid,
    });
    const jpegUri = await normalizeEndProcessJpeg(persistentUri);
    const pending = await buildEndProcessPendingStamp({
      persistentUri: jpegUri,
      defaultName: params.defaultName,
      shutterEpochMs: params.shutterEpochMs,
    });
    const result = await stampEndProcessPending(pending);

    return { result, pending: result.ok ? null : pending };
  } catch (error) {
    return {
      result: {
        ok: false,
        cancelled: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process the End-Process Image.',
      },
      pending: null,
    };
  }
}
