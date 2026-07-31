import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import type { LivePhotoWatermarkMeta } from '../utils/livePhotoWatermarkFormat';
import type { LivePhotoWatermarkProcessorHandle } from '../components/evidence/LivePhotoWatermarkProcessor';
import { stampImageOnServer } from '../api/evidenceStampApi';
import {
  isPhotoManipulatorAvailable,
  isViewShotAvailable,
  stampImageWithPhotoManipulator,
} from '../utils/stampImageNative';

let processor: LivePhotoWatermarkProcessorHandle | null = null;

export interface LivePhotoStampGpsContext {
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

export interface LivePhotoStampResult {
  uri: string;
  /** False when local/server burn failed and capture was kept for server-side stamp on upload. */
  preStamped: boolean;
}

export function registerLivePhotoWatermarkProcessor(
  handle: LivePhotoWatermarkProcessorHandle | null,
): void {
  processor = handle;

  if (__DEV__) {
    console.log('[LivePhotoWatermark] processor registered:', Boolean(handle), {
      viewShot: isViewShotAvailable(),
      photoManipulator: isPhotoManipulatorAvailable(),
    });
  }
}

export function isDeferredStampUri(uri: string): boolean {
  return uri.includes('stamp-deferred-');
}

function toSafeText(value: unknown, fallback = '—'): string {
  if (value == null) {
    return fallback;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : fallback;
}

function sanitizeWatermarkMeta(meta: LivePhotoWatermarkMeta): LivePhotoWatermarkMeta {
  return {
    capturedAtLabel: toSafeText(meta.capturedAtLabel),
    latitudeLabel: toSafeText(meta.latitudeLabel),
    longitudeLabel: toSafeText(meta.longitudeLabel),
    accuracyLabel: toSafeText(meta.accuracyLabel),
    villageLabel: toSafeText(meta.villageLabel),
    talukaLabel: toSafeText(meta.talukaLabel),
    districtLabel: toSafeText(meta.districtLabel),
    stateLabel: toSafeText(meta.stateLabel),
  };
}

async function describeSource(uri: string): Promise<{ exists: boolean; size: number | null }> {
  try {
    const info = await FileSystem.getInfoAsync(uri);

    return {
      exists: Boolean(info.exists),
      size: info.exists && 'size' in info && typeof info.size === 'number' ? info.size : null,
    };
  } catch {
    return { exists: false, size: null };
  }
}

function logStampDiag(message: string, details?: Record<string, unknown>): void {
  if (__DEV__) {
    console.log(`[LivePhotoWatermark] ${message}`, details ?? {});
  }
}

function withFileScheme(path: string): string {
  if (Platform.OS === 'android' && !path.startsWith('file://') && !path.startsWith('content://')) {
    return `file://${path}`;
  }

  return path;
}

async function stampWithViewShot(uri: string, meta: LivePhotoWatermarkMeta): Promise<string | null> {
  if (!processor) {
    logStampDiag('view-shot skipped: processor not registered');
    return null;
  }

  if (!isViewShotAvailable()) {
    logStampDiag('view-shot skipped: RNViewShot native module missing');
    return null;
  }

  try {
    const watermarkedUri = await processor.applyWatermark(uri, meta);

    if (!watermarkedUri || watermarkedUri === uri) {
      logStampDiag('view-shot returned empty or unchanged uri');
      return null;
    }

    return watermarkedUri;
  } catch (error) {
    logStampDiag('view-shot failed', {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function stampWithPhotoManipulator(uri: string, meta: LivePhotoWatermarkMeta): Promise<string | null> {
  if (!isPhotoManipulatorAvailable()) {
    logStampDiag('photo-manipulator skipped: native module missing');
    return null;
  }

  try {
    return await stampImageWithPhotoManipulator(uri, meta);
  } catch (error) {
    logStampDiag('photo-manipulator failed', {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function stampWithServer(gps: LivePhotoStampGpsContext): Promise<string | null> {
  try {
    return await stampImageOnServer(gps);
  } catch (error) {
    logStampDiag('server stamp failed', {
      name: error instanceof Error ? error.name : 'Error',
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Keep capture usable when native stamp modules are missing and the phone cannot
 * reach /mobile/stamp-image. Upload path stamps these images on the server.
 */
async function persistDeferredStampCopy(uri: string): Promise<string> {
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error('Unable to save the captured photo on this device.');
  }

  const stampDir = `${directory}BhuguardDrafts/stamped/`;
  await FileSystem.makeDirectoryAsync(stampDir, { intermediates: true });
  const targetPath = `${stampDir}stamp-deferred-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: targetPath });

  const output = await describeSource(targetPath);

  if (!output.exists) {
    throw new Error('Could not save the captured photo for stamping. Retake and try again.');
  }

  return withFileScheme(targetPath);
}

export async function applyLivePhotoWatermark(
  uri: string,
  meta: LivePhotoWatermarkMeta,
  gps: LivePhotoStampGpsContext,
): Promise<string> {
  const result = await applyLivePhotoWatermarkDetailed(uri, meta, gps);

  return result.uri;
}

export async function applyLivePhotoWatermarkDetailed(
  uri: string,
  meta: LivePhotoWatermarkMeta,
  gps: LivePhotoStampGpsContext,
): Promise<LivePhotoStampResult> {
  const safeMeta = sanitizeWatermarkMeta(meta);
  const source = await describeSource(uri);

  logStampDiag('stamp start', {
    uri,
    exists: source.exists,
    size: source.size,
    viewShot: isViewShotAvailable(),
    photoManipulator: isPhotoManipulatorAvailable(),
    processorRegistered: Boolean(processor),
    hasGps: gps.latitude != null && gps.longitude != null,
  });

  if (!uri) {
    throw new Error('Photo source is missing. Retake the photo and try again.');
  }

  if (!source.exists) {
    throw new Error('Captured photo file was not found on this device. Retake the photo and try again.');
  }

  if (gps.latitude == null || gps.longitude == null) {
    throw new Error('GPS coordinates are required to stamp the photo. Enable location and try again.');
  }

  const viewShotUri = await stampWithViewShot(uri, safeMeta);

  if (viewShotUri) {
    const output = await describeSource(viewShotUri);
    logStampDiag('stamp path: view-shot', { outputUri: viewShotUri, size: output.size });
    return { uri: viewShotUri, preStamped: true };
  }

  const manipulatorUri = await stampWithPhotoManipulator(uri, safeMeta);

  if (manipulatorUri) {
    const output = await describeSource(manipulatorUri);
    logStampDiag('stamp path: photo-manipulator', { outputUri: manipulatorUri, size: output.size });
    return { uri: manipulatorUri, preStamped: true };
  }

  const serverUri = await stampWithServer({ ...gps, uri });

  if (serverUri) {
    const output = await describeSource(serverUri);
    logStampDiag('stamp path: server', { outputUri: serverUri, size: output.size });
    return { uri: serverUri, preStamped: true };
  }

  // Last resort: keep the capture so Biochar Process is not blocked on this APK.
  // Server stamps on evidence upload when evidence_pre_stamped is not set.
  const deferredUri = await persistDeferredStampCopy(uri);
  logStampDiag('stamp path: deferred-copy', { outputUri: deferredUri });

  return { uri: deferredUri, preStamped: false };
}
