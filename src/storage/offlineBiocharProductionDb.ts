/**
 * Offline biochar production queue.
 *
 * Uses AsyncStorage so older native builds without ExpoSQLite still run.
 * Same public API as the planned SQLite store; swap backend later after rebuild.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type OfflineProductionStatus =
  | 'pending_sync'
  | 'syncing'
  | 'sync_failed'
  | 'submitted_for_review'
  | 'completed'
  | 'approved'
  | 'rejected';

export type OfflineFileUploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface OfflineProductionSubmissionRow {
  local_id: number;
  submission_uuid: string;
  artisan_id: number;
  product_id: string | null;
  batch_code_local: string | null;
  server_batch_id: number | null;
  farmer_id: number;
  farm_id: number;
  payload_json: string;
  status: OfflineProductionStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  submitted_offline_at: string;
  sync_started_at: string | null;
  synced_at: string | null;
  schema_version: number;
}

export interface OfflineProductionFileRow {
  id: number;
  submission_uuid: string;
  evidence_type: string;
  sequence_number: number | null;
  local_uri: string;
  mime_type: string | null;
  size: number | null;
  checksum: string | null;
  upload_status: OfflineFileUploadStatus;
  upload_attempts: number;
  server_evidence_id: number | null;
  server_path: string | null;
  last_error: string | null;
}

const STORE_KEY = 'bhuguard_offline_biochar_queue_v1';
const SCHEMA_VERSION = 1;

interface OfflineStore {
  nextLocalId: number;
  nextFileId: number;
  submissions: OfflineProductionSubmissionRow[];
  files: OfflineProductionFileRow[];
}

async function readStore(): Promise<OfflineStore> {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) {
    return { nextLocalId: 1, nextFileId: 1, submissions: [], files: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OfflineStore>;
    return {
      nextLocalId: Number(parsed.nextLocalId) > 0 ? Number(parsed.nextLocalId) : 1,
      nextFileId: Number(parsed.nextFileId) > 0 ? Number(parsed.nextFileId) : 1,
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      files: Array.isArray(parsed.files) ? parsed.files : [],
    };
  } catch {
    return { nextLocalId: 1, nextFileId: 1, submissions: [], files: [] };
  }
}

async function writeStore(store: OfflineStore): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export async function insertOfflineSubmission(params: {
  submissionUuid: string;
  artisanId: number;
  productId?: string | null;
  batchCodeLocal?: string | null;
  farmerId: number;
  farmId: number;
  payloadJson: string;
  status?: OfflineProductionStatus;
  submittedOfflineAt?: string;
}): Promise<OfflineProductionSubmissionRow> {
  const store = await readStore();
  const now = new Date().toISOString();
  const status = params.status ?? 'pending_sync';
  const submittedOfflineAt = params.submittedOfflineAt ?? now;

  const existingIndex = store.submissions.findIndex(
    (row) => row.submission_uuid === params.submissionUuid,
  );

  const row: OfflineProductionSubmissionRow = {
    local_id: existingIndex >= 0 ? store.submissions[existingIndex].local_id : store.nextLocalId,
    submission_uuid: params.submissionUuid,
    artisan_id: params.artisanId,
    product_id: params.productId ?? null,
    batch_code_local: params.batchCodeLocal ?? null,
    server_batch_id: existingIndex >= 0 ? store.submissions[existingIndex].server_batch_id : null,
    farmer_id: params.farmerId,
    farm_id: params.farmId,
    payload_json: params.payloadJson,
    status,
    retry_count: existingIndex >= 0 ? store.submissions[existingIndex].retry_count : 0,
    last_error: null,
    created_at: existingIndex >= 0 ? store.submissions[existingIndex].created_at : now,
    submitted_offline_at: submittedOfflineAt,
    sync_started_at: existingIndex >= 0 ? store.submissions[existingIndex].sync_started_at : null,
    synced_at: existingIndex >= 0 ? store.submissions[existingIndex].synced_at : null,
    schema_version: SCHEMA_VERSION,
  };

  if (existingIndex >= 0) {
    store.submissions[existingIndex] = row;
  } else {
    store.submissions.unshift(row);
    store.nextLocalId += 1;
  }

  await writeStore(store);
  return row;
}

export async function insertOfflineFile(params: {
  submissionUuid: string;
  evidenceType: string;
  sequenceNumber?: number | null;
  localUri: string;
  mimeType?: string | null;
  size?: number | null;
  checksum?: string | null;
}): Promise<void> {
  const store = await readStore();
  const sequenceNumber = params.sequenceNumber ?? null;
  const existingIndex = store.files.findIndex(
    (file) =>
      file.submission_uuid === params.submissionUuid &&
      file.evidence_type === params.evidenceType &&
      file.sequence_number === sequenceNumber,
  );

  const row: OfflineProductionFileRow = {
    id: existingIndex >= 0 ? store.files[existingIndex].id : store.nextFileId,
    submission_uuid: params.submissionUuid,
    evidence_type: params.evidenceType,
    sequence_number: sequenceNumber,
    local_uri: params.localUri,
    mime_type: params.mimeType ?? null,
    size: params.size ?? null,
    checksum: params.checksum ?? null,
    upload_status: 'pending',
    upload_attempts: existingIndex >= 0 ? store.files[existingIndex].upload_attempts : 0,
    server_evidence_id: existingIndex >= 0 ? store.files[existingIndex].server_evidence_id : null,
    server_path: existingIndex >= 0 ? store.files[existingIndex].server_path : null,
    last_error: null,
  };

  if (existingIndex >= 0) {
    store.files[existingIndex] = row;
  } else {
    store.files.push(row);
    store.nextFileId += 1;
  }

  await writeStore(store);
}

export async function getOfflineSubmissionByUuid(
  submissionUuid: string,
): Promise<OfflineProductionSubmissionRow | null> {
  const store = await readStore();
  return store.submissions.find((row) => row.submission_uuid === submissionUuid) ?? null;
}

export async function listOfflineSubmissionsForArtisan(
  artisanId: number,
  statuses?: OfflineProductionStatus[],
): Promise<OfflineProductionSubmissionRow[]> {
  const store = await readStore();
  return store.submissions
    .filter((row) => row.artisan_id === artisanId)
    .filter((row) => !statuses || statuses.length === 0 || statuses.includes(row.status))
    .sort((a, b) => b.submitted_offline_at.localeCompare(a.submitted_offline_at));
}

export async function countOfflineSubmissionsByStatus(
  artisanId: number,
): Promise<Record<string, number>> {
  const rows = await listOfflineSubmissionsForArtisan(artisanId);
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}

export async function listOfflineFiles(
  submissionUuid: string,
): Promise<OfflineProductionFileRow[]> {
  const store = await readStore();
  return store.files
    .filter((file) => file.submission_uuid === submissionUuid)
    .sort((a, b) => a.id - b.id);
}

export async function updateOfflineSubmissionStatus(
  submissionUuid: string,
  status: OfflineProductionStatus,
  extras?: {
    lastError?: string | null;
    serverBatchId?: number | null;
    incrementRetry?: boolean;
    markSyncStarted?: boolean;
    markSynced?: boolean;
  },
): Promise<void> {
  const store = await readStore();
  const index = store.submissions.findIndex((row) => row.submission_uuid === submissionUuid);
  if (index < 0) {
    return;
  }

  const now = new Date().toISOString();
  const current = store.submissions[index];
  store.submissions[index] = {
    ...current,
    status,
    last_error: extras?.lastError !== undefined ? extras.lastError : current.last_error,
    server_batch_id:
      extras?.serverBatchId !== undefined ? extras.serverBatchId : current.server_batch_id,
    retry_count: extras?.incrementRetry ? current.retry_count + 1 : current.retry_count,
    sync_started_at: extras?.markSyncStarted ? now : current.sync_started_at,
    synced_at: extras?.markSynced ? now : current.synced_at,
  };

  await writeStore(store);
}

export async function updateOfflineFileStatus(
  id: number,
  uploadStatus: OfflineFileUploadStatus,
  extras?: {
    lastError?: string | null;
    serverEvidenceId?: number | null;
    serverPath?: string | null;
    incrementAttempts?: boolean;
  },
): Promise<void> {
  const store = await readStore();
  const index = store.files.findIndex((file) => file.id === id);
  if (index < 0) {
    return;
  }

  const current = store.files[index];
  store.files[index] = {
    ...current,
    upload_status: uploadStatus,
    last_error: extras?.lastError !== undefined ? extras.lastError : current.last_error,
    server_evidence_id:
      extras?.serverEvidenceId !== undefined ? extras.serverEvidenceId : current.server_evidence_id,
    server_path: extras?.serverPath !== undefined ? extras.serverPath : current.server_path,
    upload_attempts: extras?.incrementAttempts
      ? current.upload_attempts + 1
      : current.upload_attempts,
  };

  await writeStore(store);
}

export async function hasPendingOfflineSubmissions(artisanId: number): Promise<boolean> {
  const rows = await listOfflineSubmissionsForArtisan(artisanId, [
    'pending_sync',
    'syncing',
    'sync_failed',
  ]);
  return rows.length > 0;
}

export async function listSyncableSubmissions(
  artisanId: number,
): Promise<OfflineProductionSubmissionRow[]> {
  return listOfflineSubmissionsForArtisan(artisanId, ['pending_sync', 'sync_failed']);
}
