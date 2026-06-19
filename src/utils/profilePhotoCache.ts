import * as FileSystem from 'expo-file-system/legacy';

import { getAuthToken } from '../storage/authStorage';

function isLocalImageUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

function normalizeCacheKey(remoteUrl: string): string {
  return remoteUrl.split('?')[0] ?? remoteUrl;
}

const completedCache = new Map<string, string>();
const inflightDownloads = new Map<string, Promise<string | null>>();

async function cleanupOldProfilePhotos(keepFileName?: string): Promise<void> {
  const cacheDir = FileSystem.cacheDirectory;

  if (!cacheDir) {
    return;
  }

  try {
    const files = await FileSystem.readDirectoryAsync(cacheDir);

    await Promise.all(
      files
        .filter((file) => file.startsWith('farmer-profile-') && file !== keepFileName)
        .map((file) => FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true })),
    );
  } catch {
    // Ignore cache cleanup errors.
  }
}

export function invalidateProfilePhotoCache(remoteUrl?: string | null): void {
  if (!remoteUrl) {
    completedCache.clear();
    inflightDownloads.clear();
    return;
  }

  const cacheKey = normalizeCacheKey(remoteUrl);
  completedCache.delete(cacheKey);
  inflightDownloads.delete(cacheKey);
}

export async function cacheAuthenticatedImage(
  remoteUrl: string,
  cacheFileName = 'farmer-profile-current.jpg',
): Promise<string | null> {
  if (!remoteUrl || isLocalImageUri(remoteUrl)) {
    return remoteUrl || null;
  }

  const cacheKey = normalizeCacheKey(remoteUrl);
  const cachedUri = completedCache.get(cacheKey);

  if (cachedUri) {
    return cachedUri;
  }

  const inflight = inflightDownloads.get(cacheKey);

  if (inflight) {
    return inflight;
  }

  const downloadPromise = (async () => {
    try {
      const token = await getAuthToken();
      const cachePath = `${FileSystem.cacheDirectory ?? ''}${cacheFileName}`;

      const result = await FileSystem.downloadAsync(remoteUrl, cachePath, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (result.status >= 200 && result.status < 300) {
        await cleanupOldProfilePhotos(cacheFileName);
        completedCache.set(cacheKey, result.uri);

        return result.uri;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[Bhuguard Profile] Failed to cache profile photo:', error);
      }
    }

    return null;
  })();

  inflightDownloads.set(cacheKey, downloadPromise);

  try {
    return await downloadPromise;
  } finally {
    inflightDownloads.delete(cacheKey);
  }
}

export { isLocalImageUri };
