import type { LivePhotoWatermarkMeta } from '../utils/livePhotoWatermarkFormat';
import type { LivePhotoWatermarkProcessorHandle } from '../components/evidence/LivePhotoWatermarkProcessor';

let processor: LivePhotoWatermarkProcessorHandle | null = null;

export function registerLivePhotoWatermarkProcessor(
  handle: LivePhotoWatermarkProcessorHandle | null,
): void {
  processor = handle;
}

export async function applyLivePhotoWatermark(
  uri: string,
  meta: LivePhotoWatermarkMeta,
): Promise<string> {
  if (!processor) {
    return uri;
  }

  try {
    return await processor.applyWatermark(uri, meta);
  } catch {
    return uri;
  }
}
