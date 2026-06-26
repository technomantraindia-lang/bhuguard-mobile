import type { LivePhotoWatermarkMeta } from '../utils/livePhotoWatermarkFormat';
import type { LivePhotoWatermarkProcessorHandle } from '../components/evidence/LivePhotoWatermarkProcessor';
import { stampImageOnServer, type ClientStampImageInput } from '../api/evidenceStampApi';
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
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
}

export function registerLivePhotoWatermarkProcessor(
  handle: LivePhotoWatermarkProcessorHandle | null,
): void {
  processor = handle;
}

async function stampWithViewShot(uri: string, meta: LivePhotoWatermarkMeta): Promise<string | null> {
  if (!processor || !isViewShotAvailable()) {
    return null;
  }

  try {
    const watermarkedUri = await processor.applyWatermark(uri, meta);

    if (!watermarkedUri || watermarkedUri === uri) {
      return null;
    }

    return watermarkedUri;
  } catch {
    return null;
  }
}

async function stampWithPhotoManipulator(uri: string, meta: LivePhotoWatermarkMeta): Promise<string | null> {
  if (!isPhotoManipulatorAvailable()) {
    return null;
  }

  try {
    return await stampImageWithPhotoManipulator(uri, meta);
  } catch {
    return null;
  }
}

async function stampWithServer(gps: LivePhotoStampGpsContext): Promise<string | null> {
  try {
    return await stampImageOnServer(gps);
  } catch {
    return null;
  }
}

export async function applyLivePhotoWatermark(
  uri: string,
  meta: LivePhotoWatermarkMeta,
  gps: LivePhotoStampGpsContext,
): Promise<string> {
  const viewShotUri = await stampWithViewShot(uri, meta);

  if (viewShotUri) {
    return viewShotUri;
  }

  const manipulatorUri = await stampWithPhotoManipulator(uri, meta);

  if (manipulatorUri) {
    return manipulatorUri;
  }

  const serverUri = await stampWithServer(gps);

  if (serverUri) {
    return serverUri;
  }

  throw new Error(
    'Could not burn timestamp onto the photo. Rebuild the Bhuguard app APK, or check your internet connection and try again.',
  );
}
