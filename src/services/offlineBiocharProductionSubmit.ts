import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import type { BiocharEvidenceKey } from '../constants/biocharProduction';
import {
  insertOfflineFile,
  insertOfflineSubmission,
  type OfflineProductionSubmissionRow,
} from '../storage/offlineBiocharProductionDb';
import { copyEvidenceIntoSubmissionStorage, createSubmissionUuid } from '../utils/offlineBiocharEvidenceStorage';
import {
  buildOfflineProductionPayload,
  validateOfflineProductionSnapshot,
  type OfflineProductionPayload,
  type OfflineSubmitFormSnapshot,
} from '../utils/offlineBiocharProductionPayload';

const PROCESS_EVIDENCE_KEYS: BiocharEvidenceKey[] = [
  'starting_pyrolysis_photo',
  'mid_stage_photo',
  'end_stage_before_quenching_photo',
  'quenching_photo',
  'biochar_unloaded_photo',
  'char_sample_photo',
];

async function persistAssetFile(params: {
  submissionUuid: string;
  evidenceType: string;
  sequenceNumber?: number | null;
  asset?: BiocharEvidenceAsset | null;
}): Promise<BiocharEvidenceAsset | null> {
  const asset = params.asset;
  if (!asset) {
    return null;
  }

  const sourceUri = asset.localUri || asset.uri;
  if (!sourceUri || sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    if (asset.remoteUrl || asset.source === 'remote') {
      return asset;
    }
    throw new Error(`Local file missing for ${params.evidenceType}.`);
  }

  const copied = await copyEvidenceIntoSubmissionStorage({
    sourceUri,
    submissionUuid: params.submissionUuid,
    evidenceType: params.evidenceType,
    sequenceNumber: params.sequenceNumber,
    mimeType: asset.mimeType,
  });

  await insertOfflineFile({
    submissionUuid: params.submissionUuid,
    evidenceType: params.evidenceType,
    sequenceNumber: params.sequenceNumber ?? null,
    localUri: copied.localUri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: copied.size,
    checksum: copied.checksum,
  });

  return {
    ...asset,
    localUri: copied.localUri,
    uri: copied.localUri,
    source: 'local',
    uploadStatus: 'local_pending',
  };
}

export async function createImmutableOfflineSubmission(params: {
  artisanId: number;
  form: OfflineSubmitFormSnapshot;
}): Promise<{
  submission: OfflineProductionSubmissionRow;
  payload: OfflineProductionPayload;
}> {
  const missing = validateOfflineProductionSnapshot(params.form);
  if (missing.length > 0) {
    throw new Error(`Complete required fields before submit:\n• ${missing.join('\n• ')}`);
  }

  const submissionUuid = await createSubmissionUuid();
  const submittedOfflineAt = new Date().toISOString();

  const evidence: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>> = {};
  for (const key of PROCESS_EVIDENCE_KEYS) {
    const persisted = await persistAssetFile({
      submissionUuid,
      evidenceType: key,
      asset: params.form.evidence[key],
    });
    if (persisted) {
      evidence[key] = persisted;
    }
  }

  const moistureReadings = [];
  for (let i = 0; i < 5; i += 1) {
    const reading = params.form.moistureReadings[i];
    const sequence = reading?.sequence ?? i + 1;
    const photo = await persistAssetFile({
      submissionUuid,
      evidenceType: `moisture_reading_${sequence}`,
      sequenceNumber: sequence,
      asset: reading?.photo,
    });
    moistureReadings.push({
      sequence,
      moistureReading: reading?.moistureReading ?? '',
      notes: reading?.notes ?? '',
      photo: photo ?? undefined,
    });
  }

  const formForPayload: OfflineSubmitFormSnapshot = {
    ...params.form,
    evidence,
    moistureReadings,
  };

  const payload = buildOfflineProductionPayload({
    submissionUuid,
    artisanId: params.artisanId,
    form: formForPayload,
    submittedOfflineAt,
  });

  const submission = await insertOfflineSubmission({
    submissionUuid,
    artisanId: params.artisanId,
    productId: payload.product_id,
    batchCodeLocal: payload.batch_code,
    farmerId: payload.farmer_id,
    farmId: payload.farm_id,
    payloadJson: JSON.stringify(payload),
    status: 'pending_sync',
    submittedOfflineAt,
  });

  return { submission, payload };
}
