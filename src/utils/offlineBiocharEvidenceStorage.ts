import * as FileSystem from 'expo-file-system/legacy';

import { guessImageExtension } from './biocharEvidencePersistence';

function createFallbackUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function createSubmissionUuid(): Promise<string> {
  try {
    const { loadExpoJsModuleWhenNativeAvailable } = await import('./safeExpoNative');
    const crypto = loadExpoJsModuleWhenNativeAvailable<{ randomUUID?: () => string }>(
      'ExpoCrypto',
      () =>
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('expo-crypto') as { randomUUID?: () => string },
    );
    if (typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through.
  }

  return createFallbackUuid();
}

export async function checksumLocalFile(uri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory) {
      return null;
    }

    const size = 'size' in info && typeof info.size === 'number' ? info.size : 0;
    const modTime =
      'modificationTime' in info && typeof info.modificationTime === 'number'
        ? info.modificationTime
        : 0;

    // Lightweight checksum without requiring ExpoCrypto on older APKs.
    return `meta:${size}:${modTime}:${uri.length}`;
  } catch {
    return null;
  }
}

export async function copyEvidenceIntoSubmissionStorage(params: {
  sourceUri: string;
  submissionUuid: string;
  evidenceType: string;
  sequenceNumber?: number | null;
  mimeType?: string | null;
}): Promise<{ localUri: string; size: number | null; checksum: string | null }> {
  const root = FileSystem.documentDirectory;
  if (!root) {
    throw new Error('Persistent document storage is unavailable on this device.');
  }

  const extension = guessImageExtension(params.sourceUri, params.mimeType ?? undefined);
  const sequencePart =
    params.sequenceNumber != null ? `_seq${params.sequenceNumber}` : '';
  const directory = `${root}BhuguardOffline/biochar-production/${params.submissionUuid}/evidence/`;

  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const destination = `${directory}${params.evidenceType}${sequencePart}.${extension}`;

  const sourceInfo = await FileSystem.getInfoAsync(params.sourceUri);
  if (!sourceInfo.exists || sourceInfo.isDirectory) {
    throw new Error(`Evidence file missing for ${params.evidenceType}. Recapture this photo and try again.`);
  }

  if (params.sourceUri !== destination) {
    try {
      await FileSystem.copyAsync({
        from: params.sourceUri,
        to: destination,
      });
    } catch (copyError) {
      const message =
        copyError instanceof Error ? copyError.message : 'Unable to copy evidence into secure storage.';
      throw new Error(`Could not save ${params.evidenceType}: ${message}`);
    }
  }

  const destInfo = await FileSystem.getInfoAsync(destination);
  const size =
    destInfo.exists && !destInfo.isDirectory && 'size' in destInfo && typeof destInfo.size === 'number'
      ? destInfo.size
      : null;
  const checksum = await checksumLocalFile(destination);

  return { localUri: destination, size, checksum };
}
