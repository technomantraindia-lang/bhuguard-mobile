import { loadExpoJsModuleWhenNativeAvailable } from './safeExpoNative';

type ImageManipulatorModule = {
  manipulateAsync: (
    uri: string,
    actions: Array<{ resize?: { width?: number; height?: number } }>,
    options: { compress: number; format: unknown },
  ) => Promise<{ uri: string }>;
  SaveFormat: { JPEG: unknown };
};

const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_QUALITY = 0.7;

function resolveImageManipulator(): ImageManipulatorModule | null {
  return loadExpoJsModuleWhenNativeAvailable('ExpoImageManipulator', () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-image-manipulator') as ImageManipulatorModule,
  );
}

/**
 * Resize/compress a local image URI for faster upload.
 * Returns the original URI if manipulator is unavailable.
 * Never converts to base64 — URI only.
 */
export async function compressEvidenceImage(
  uri: string,
  options?: {
    maxWidth?: number;
    quality?: number;
  },
): Promise<string> {
  if (!uri || uri.startsWith('data:')) {
    return uri;
  }

  const ImageManipulator = resolveImageManipulator();

  if (!ImageManipulator) {
    return uri;
  }

  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options?.quality ?? DEFAULT_QUALITY;

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );

    return result.uri || uri;
  } catch {
    return uri;
  }
}
