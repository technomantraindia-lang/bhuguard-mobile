import * as FileSystem from 'expo-file-system/legacy';

import {
  createDraftUuid,
  createLocalMediaUuid,
  guessImageExtension,
  localEvidenceFileExists,
  resolveBiocharEvidenceUrl,
} from './biocharEvidencePersistence';

export {
  createDraftUuid,
  createLocalMediaUuid,
  guessImageExtension,
  localEvidenceFileExists,
  resolveBiocharEvidenceUrl as resolveFarmerFarmActivityEvidenceUrl,
};

/** RFC UUID for API idempotency (`client_draft_uuid`). Falls back for older runtimes. */
export function createFarmActivityClientDraftUuid(): string {
  const cryptoObj = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (typeof cryptoObj?.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;

    return value.toString(16);
  });
}

export type FarmerFarmActivityEvidenceUploadStatus =
  | 'local_pending'
  | 'uploading'
  | 'uploaded'
  | 'failed';

export interface FarmerFarmActivityEvidenceAsset {
  uri: string;
  previewUri?: string;
  name: string;
  type: string;
  label?: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  localMediaUuid?: string;
  localUri?: string;
  remoteUrl?: string | null;
  evidenceId?: number | null;
  uploadStatus?: FarmerFarmActivityEvidenceUploadStatus;
  isStamped?: boolean;
}

export async function persistFarmerFarmActivityEvidenceFile(params: {
  sourceUri: string;
  farmerId: number;
  draftUuid: string;
  localMediaUuid: string;
  extension?: string;
}): Promise<string> {
  const root = FileSystem.documentDirectory;

  if (!root) {
    throw new Error('Persistent document storage is unavailable on this device.');
  }

  const extension = (params.extension ?? 'jpg').replace(/^\./, '');
  const directory = `${root}BhuguardDrafts/farmer/${params.farmerId}/biochar-activity/${params.draftUuid}/evidence/`;

  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const destination = `${directory}${params.localMediaUuid}.${extension}`;

  await FileSystem.copyAsync({
    from: params.sourceUri,
    to: destination,
  });

  return destination;
}

export async function ensurePersistedFarmerFarmActivityEvidence(
  asset: FarmerFarmActivityEvidenceAsset,
  farmerId: number,
  draftUuid: string,
): Promise<FarmerFarmActivityEvidenceAsset> {
  const sourceUri = asset.localUri || asset.uri;

  if (!sourceUri || sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    return asset;
  }

  if (asset.localUri && (await localEvidenceFileExists(asset.localUri))) {
    return {
      ...asset,
      uri: asset.localUri,
      previewUri: asset.localUri,
      uploadStatus: asset.uploadStatus === 'uploaded' ? 'uploaded' : 'local_pending',
    };
  }

  const localMediaUuid = asset.localMediaUuid || createLocalMediaUuid();
  const extension = guessImageExtension(sourceUri, asset.type);
  const localUri = await persistFarmerFarmActivityEvidenceFile({
    sourceUri,
    farmerId,
    draftUuid,
    localMediaUuid,
    extension,
  });

  return {
    ...asset,
    localMediaUuid,
    localUri,
    uri: localUri,
    previewUri: localUri,
    uploadStatus: asset.uploadStatus === 'uploaded' ? 'uploaded' : 'local_pending',
  };
}

export async function clearFarmerFarmActivityEvidenceDirectory(params: {
  farmerId: number;
  draftUuid: string;
}): Promise<void> {
  const root = FileSystem.documentDirectory;

  if (!root) {
    return;
  }

  const directory = `${root}BhuguardDrafts/farmer/${params.farmerId}/biochar-activity/${params.draftUuid}/`;

  try {
    const info = await FileSystem.getInfoAsync(directory);

    if (info.exists) {
      await FileSystem.deleteAsync(directory, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup after successful submit.
  }
}
