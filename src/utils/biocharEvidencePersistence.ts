import * as FileSystem from 'expo-file-system/legacy';

import { resolveMediaUrl } from './mediaUrl';

export type BiocharEvidenceUploadStatus =
  | 'local_pending'
  | 'uploading'
  | 'uploaded'
  | 'failed';

export function createLocalMediaUuid(): string {
  return `lm-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function createDraftUuid(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function resolveBiocharEvidenceUrl(path: string | null | undefined): string | null {
  if (!path || path === '-') {
    return null;
  }

  const trimmed = path.trim();

  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/api/')) {
    return resolveMediaUrl(trimmed);
  }

  const normalized = trimmed.replace(/^\//, '');
  const storagePath = normalized.startsWith('storage/') ? `/${normalized}` : `/storage/${normalized}`;

  return resolveMediaUrl(storagePath);
}

export async function localEvidenceFileExists(uri: string | null | undefined): Promise<boolean> {
  if (!uri) {
    return false;
  }

  if (uri.startsWith('content://') || uri.startsWith('http://') || uri.startsWith('https://')) {
    return false;
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);

    return Boolean(info.exists);
  } catch {
    return false;
  }
}

export async function persistBiocharDraftEvidenceFile(params: {
  sourceUri: string;
  draftUuid: string;
  localMediaUuid: string;
  extension?: string;
}): Promise<string> {
  const root = FileSystem.documentDirectory;

  if (!root) {
    throw new Error('Persistent document storage is unavailable on this device.');
  }

  const extension = (params.extension ?? 'jpg').replace(/^\./, '');
  const directory = `${root}BhuguardDrafts/artisan/biochar-production/${params.draftUuid}/evidence/`;

  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const destination = `${directory}${params.localMediaUuid}.${extension}`;

  await FileSystem.copyAsync({
    from: params.sourceUri,
    to: destination,
  });

  return destination;
}

export function guessImageExtension(uri: string, mimeType?: string): string {
  if (mimeType?.includes('png')) {
    return 'png';
  }

  if (mimeType?.includes('webp')) {
    return 'webp';
  }

  const match = uri.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);

  if (match?.[1] && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(match[1])) {
    return match[1] === 'jpeg' ? 'jpg' : match[1];
  }

  return 'jpg';
}
