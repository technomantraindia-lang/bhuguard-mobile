import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import type { BiocharEvidenceKey } from '../constants/biocharProduction';
import { BIOCHAR_EVIDENCE_API_FIELD } from '../constants/biocharProduction';
import { extractList, pickString, type ApiRecord } from './apiHelpers';
import {
  createDraftUuid,
  createLocalMediaUuid,
  guessImageExtension,
  localEvidenceFileExists,
  persistBiocharDraftEvidenceFile,
  resolveBiocharEvidenceUrl,
} from './biocharEvidencePersistence';

const LEGACY_PATH_KEYS: Array<{ pathKey: string; evidenceKey: BiocharEvidenceKey }> = [
  { pathKey: 'feedstock_photo_path', evidenceKey: 'feedstock_photo' },
  { pathKey: 'moisture_photo_path', evidenceKey: 'moisture_image' },
  { pathKey: 'production_photo_path', evidenceKey: 'starting_pyrolysis_photo' },
  { pathKey: 'batch_output_photo_path', evidenceKey: 'biochar_unloaded_photo' },
  { pathKey: 'operator_photo_path', evidenceKey: 'biochar_mixing_photo' },
];

const VALID_EVIDENCE_KEYS = new Set<string>(Object.keys(BIOCHAR_EVIDENCE_API_FIELD));

export function mapRemoteBiocharEvidences(
  batch: ApiRecord,
): Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>> {
  const mapped: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>> = {};
  const evidences = extractList(batch, ['evidences']);

  for (const item of evidences) {
    const key = pickString(item, 'evidence_type', 'evidenceType') as BiocharEvidenceKey;

    if (!VALID_EVIDENCE_KEYS.has(key)) {
      continue;
    }

    const path =
      pickString(item, 'stamped_file_path', 'stampedFilePath', 'url', 'file_path', 'filePath') !== '-'
        ? pickString(item, 'stamped_file_path', 'stampedFilePath', 'url', 'file_path', 'filePath')
        : '';

    const remoteUrl = resolveBiocharEvidenceUrl(path);

    if (!remoteUrl) {
      continue;
    }

    mapped[key] = {
      uri: remoteUrl,
      remoteUrl,
      name: `${key}.jpg`,
      mimeType: 'image/jpeg',
      evidenceId: item.id != null ? Number(item.id) : undefined,
      source: 'remote',
      uploadStatus: 'uploaded',
      isStamped: item.is_stamped !== false,
      capturedAt:
        pickString(item, 'captured_at', 'capturedAt') !== '-'
          ? pickString(item, 'captured_at', 'capturedAt')
          : undefined,
      latitude: item.latitude != null ? Number(item.latitude) : null,
      longitude: item.longitude != null ? Number(item.longitude) : null,
      accuracy: item.gps_accuracy != null ? Number(item.gps_accuracy) : null,
      village:
        pickString(item, 'village_name', 'villageName') !== '-'
          ? pickString(item, 'village_name', 'villageName')
          : undefined,
      taluka:
        pickString(item, 'taluka_name', 'talukaName') !== '-'
          ? pickString(item, 'taluka_name', 'talukaName')
          : undefined,
      district:
        pickString(item, 'district_name', 'districtName') !== '-'
          ? pickString(item, 'district_name', 'districtName')
          : undefined,
      state:
        pickString(item, 'state_name', 'stateName') !== '-'
          ? pickString(item, 'state_name', 'stateName')
          : undefined,
    };
  }

  for (const { pathKey, evidenceKey } of LEGACY_PATH_KEYS) {
    if (mapped[evidenceKey]) {
      continue;
    }

    const hasProcessEvidenceRows = evidences.some((item) => {
      const key = pickString(item, 'evidence_type', 'evidenceType');
      return (
        key === 'starting_pyrolysis_photo' ||
        key === 'mid_stage_photo' ||
        key === 'end_stage_before_quenching_photo' ||
        key === 'quenching_photo' ||
        key === 'biochar_unloaded_photo' ||
        key === 'biochar_mixing_photo'
      );
    });

    // Process-flow records must use evidence rows. Legacy batch columns are often
    // overwritten by stage photos and must not fake an unloaded/mixing sync state.
    if (
      hasProcessEvidenceRows &&
      (evidenceKey === 'biochar_unloaded_photo' || evidenceKey === 'biochar_mixing_photo')
    ) {
      continue;
    }

    if (
      evidenceKey === 'biochar_unloaded_photo' &&
      (mapped.end_stage_before_quenching_photo ||
        mapped.starting_pyrolysis_photo ||
        mapped.mid_stage_photo ||
        mapped.quenching_photo)
    ) {
      continue;
    }

    if (
      evidenceKey === 'biochar_mixing_photo' &&
      (mapped.quenching_photo || mapped.biochar_unloaded_photo || mapped.end_stage_before_quenching_photo)
    ) {
      continue;
    }

    const path = pickString(batch, pathKey);

    if (path === '-') {
      continue;
    }

    const remoteUrl = resolveBiocharEvidenceUrl(path);

    if (!remoteUrl) {
      continue;
    }

    mapped[evidenceKey] = {
      uri: remoteUrl,
      remoteUrl,
      name: `${evidenceKey}.jpg`,
      mimeType: 'image/jpeg',
      source: 'remote',
      uploadStatus: 'uploaded',
      isStamped: true,
    };
  }

  // Final safeguard: never keep an unloaded remote that is identical to end-stage.
  if (
    mapped.biochar_unloaded_photo?.remoteUrl &&
    mapped.end_stage_before_quenching_photo?.remoteUrl &&
    mapped.biochar_unloaded_photo.remoteUrl === mapped.end_stage_before_quenching_photo.remoteUrl &&
    mapped.biochar_unloaded_photo.evidenceId == null
  ) {
    delete mapped.biochar_unloaded_photo;
  }

  return mapped;
}

export function mapRemoteMoisturePhoto(reading: ApiRecord, readingKey: string): BiocharEvidenceAsset | undefined {
  const path = pickString(reading, 'stamped_photo_path', 'moisture_photo_path', 'url');

  if (path === '-') {
    return undefined;
  }

  const remoteUrl = resolveBiocharEvidenceUrl(path);

  if (!remoteUrl) {
    return undefined;
  }

  return {
    uri: remoteUrl,
    remoteUrl,
    name: `moisture-reading-${readingKey}.jpg`,
    mimeType: 'image/jpeg',
    source: 'remote',
    uploadStatus: 'uploaded',
    isStamped: true,
    evidenceId: reading.id != null ? Number(reading.id) : undefined,
    capturedAt:
      pickString(reading, 'captured_at', 'capturedAt') !== '-'
        ? pickString(reading, 'captured_at', 'capturedAt')
        : undefined,
    latitude: reading.latitude != null ? Number(reading.latitude) : null,
    longitude: reading.longitude != null ? Number(reading.longitude) : null,
    accuracy: reading.gps_accuracy != null ? Number(reading.gps_accuracy) : null,
  };
}

export function isBiocharEvidenceSatisfied(asset?: BiocharEvidenceAsset | null): boolean {
  if (!asset) {
    return false;
  }

  // Confirmed process-evidence row on the server.
  if (asset.evidenceId != null) {
    return true;
  }

  if (asset.uploadStatus === 'failed' && !asset.remoteUrl && !asset.localUri) {
    return false;
  }

  const candidate = asset.localUri || asset.uri;

  // Local capture waiting to sync counts as present for step unlock.
  if (candidate && candidate !== '-' && !candidate.startsWith('http://') && !candidate.startsWith('https://')) {
    return true;
  }

  // Remote URL without evidenceId is not trusted (legacy column false positives).
  return false;
}

export async function ensurePersistedEvidenceAsset(
  asset: BiocharEvidenceAsset,
  draftUuid: string,
): Promise<BiocharEvidenceAsset> {
  const sourceUri = asset.localUri || asset.uri;

  if (!sourceUri || sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    return asset;
  }

  if (asset.localUri && (await localEvidenceFileExists(asset.localUri))) {
    return {
      ...asset,
      uri: asset.localUri,
      source: 'local',
      uploadStatus: asset.uploadStatus === 'uploaded' ? 'uploaded' : 'local_pending',
    };
  }

  const localMediaUuid = asset.localMediaUuid || createLocalMediaUuid();
  const extension = guessImageExtension(sourceUri, asset.mimeType);
  const localUri = await persistBiocharDraftEvidenceFile({
    sourceUri,
    draftUuid,
    localMediaUuid,
    extension,
  });

  return {
    ...asset,
    localMediaUuid,
    localUri,
    uri: localUri,
    source: 'local',
    uploadStatus: asset.uploadStatus === 'uploaded' ? 'uploaded' : 'local_pending',
    syncError: undefined,
  };
}

export async function mergeBiocharEvidenceMaps(
  remote: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>,
  local: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>,
): Promise<Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>> {
  const keys = new Set([
    ...(Object.keys(remote) as BiocharEvidenceKey[]),
    ...(Object.keys(local) as BiocharEvidenceKey[]),
  ]);
  const merged: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>> = {};

  for (const key of keys) {
    const localAsset = local[key];
    const remoteAsset = remote[key];

    if (localAsset?.localUri && (await localEvidenceFileExists(localAsset.localUri))) {
      const confirmedRemote =
        remoteAsset?.uploadStatus === 'uploaded' ||
        remoteAsset?.source === 'remote' ||
        remoteAsset?.evidenceId != null ||
        Boolean(remoteAsset?.remoteUrl);
      merged[key] = {
        ...remoteAsset,
        ...localAsset,
        uri: localAsset.localUri,
        source: 'local',
        uploadStatus: confirmedRemote || (localAsset.evidenceId != null && localAsset.uploadStatus === 'uploaded')
          ? 'uploaded'
          : 'local_pending',
        evidenceId: localAsset.evidenceId ?? remoteAsset?.evidenceId,
        remoteUrl: localAsset.remoteUrl ?? remoteAsset?.remoteUrl,
      };
      continue;
    }

    if (
      localAsset?.uri?.startsWith('file://') &&
      (await localEvidenceFileExists(localAsset.uri))
    ) {
      merged[key] = {
        ...remoteAsset,
        ...localAsset,
        localUri: localAsset.localUri ?? localAsset.uri,
        source: 'local',
        uploadStatus: remoteAsset ? 'uploaded' : (localAsset.uploadStatus ?? 'local_pending'),
        evidenceId: localAsset.evidenceId ?? remoteAsset?.evidenceId,
        remoteUrl: localAsset.remoteUrl ?? remoteAsset?.remoteUrl,
      };
      continue;
    }

    if (remoteAsset) {
      merged[key] = remoteAsset;
      continue;
    }

    if (localAsset?.remoteUrl || localAsset?.evidenceId != null) {
      merged[key] = {
        ...localAsset,
        uri: localAsset.remoteUrl || localAsset.uri,
        source: 'remote',
        uploadStatus: 'uploaded',
        syncError: undefined,
      };
      continue;
    }

    if (localAsset) {
      merged[key] = {
        ...localAsset,
        uploadStatus: 'failed',
        syncError: 'Evidence file could not be found on this device.',
      };
    }
  }

  return merged;
}

export async function mergeMoisturePhoto(
  remotePhoto: BiocharEvidenceAsset | undefined,
  localPhoto: BiocharEvidenceAsset | undefined,
): Promise<BiocharEvidenceAsset | undefined> {
  if (!remotePhoto && !localPhoto) {
    return undefined;
  }

  const mergedMap = await mergeBiocharEvidenceMaps(
    remotePhoto ? { feedstock_photo: remotePhoto } : {},
    localPhoto ? { feedstock_photo: localPhoto } : {},
  );

  return mergedMap.feedstock_photo;
}

export function ensureDraftUuid(existing?: string | null): string {
  return existing?.trim() ? existing : createDraftUuid();
}

export function shouldUploadEvidenceFile(asset?: BiocharEvidenceAsset | null): boolean {
  if (!asset) {
    return false;
  }

  // Only skip upload when the asset is confirmed on the server.
  if (asset.evidenceId != null) {
    return false;
  }

  if (asset.source === 'remote' && Boolean(asset.remoteUrl || (asset.uri && asset.uri.startsWith('http')))) {
    return false;
  }

  if (asset.uploadStatus === 'uploaded' && Boolean(asset.remoteUrl)) {
    return false;
  }

  const uri = asset.localUri || asset.uri;

  if (!uri || uri === '-') {
    return false;
  }

  // Upload any local device URI (file://, content://, or bare document paths).
  return !uri.startsWith('http://') && !uri.startsWith('https://');
}
