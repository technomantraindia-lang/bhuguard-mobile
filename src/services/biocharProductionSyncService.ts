import { AppState, type AppStateStatus } from 'react-native';

import { submitArtisanBiocharOfflinePackage } from '../api/artisanApi';
import { getApiErrorMessage } from '../api/authApi';
import {
  listOfflineFiles,
  listSyncableSubmissions,
  updateOfflineFileStatus,
  updateOfflineSubmissionStatus,
  type OfflineProductionSubmissionRow,
} from '../storage/offlineBiocharProductionDb';
import type { OfflineProductionPayload } from '../utils/offlineBiocharProductionPayload';
import { buildFormDataFilePart } from '../utils/liveEvidenceCapture';
import { safeNetInfoAddEventListener, safeNetInfoIsConnected } from '../utils/safeNetInfo';

/**
 * Foreground/reconnect sync only — no background-fetch/task-manager.
 * Syncs when the app is active, network returns, artisan logs in, or Retry is pressed.
 * NetInfo is loaded dynamically so older native builds without RNCNetInfo still run.
 */

type SyncProgressListener = (progress: {
  submissionUuid: string;
  status: string;
  uploadedFiles: number;
  totalFiles: number;
  message?: string;
}) => void;

let syncing = false;
let listeners = new Set<SyncProgressListener>();
let started = false;
let currentArtisanId: number | null = null;

export function setBiocharSyncArtisanId(artisanId: number | null): void {
  currentArtisanId = artisanId;
}

export function subscribeBiocharProductionSync(listener: SyncProgressListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(progress: {
  submissionUuid: string;
  status: string;
  uploadedFiles: number;
  totalFiles: number;
  message?: string;
}): void {
  listeners.forEach((listener) => listener(progress));
}

async function syncOnePackage(row: OfflineProductionSubmissionRow): Promise<void> {
  const payload = JSON.parse(row.payload_json) as OfflineProductionPayload;
  const files = await listOfflineFiles(row.submission_uuid);
  const pendingFiles = files.filter((file) => file.upload_status !== 'uploaded');

  await updateOfflineSubmissionStatus(row.submission_uuid, 'syncing', {
    markSyncStarted: true,
    lastError: null,
  });

  emit({
    submissionUuid: row.submission_uuid,
    status: 'syncing',
    uploadedFiles: files.length - pendingFiles.length,
    totalFiles: files.length,
    message: `Syncing ${files.length - pendingFiles.length} of ${files.length} images`,
  });

  const evidenceTimestamps: Record<string, string> = {};
  for (const [type, asset] of Object.entries(payload.evidence ?? {})) {
    const capturedAt = asset?.capturedAt;
    if (capturedAt) {
      evidenceTimestamps[type] = capturedAt;
    }
  }

  const formData = new FormData();
  formData.append('submission_uuid', payload.submission_uuid);
  formData.append('payload_json', JSON.stringify({
    ...payload,
    // Keep evidence metadata (captured_at) for chronology; omit bulky URI-only fields.
    evidence: Object.fromEntries(
      Object.entries(payload.evidence ?? {}).map(([type, asset]) => [
        type,
        {
          captured_at: asset?.capturedAt ?? null,
          capturedAt: asset?.capturedAt ?? null,
          latitude: asset?.latitude ?? null,
          longitude: asset?.longitude ?? null,
          accuracy: asset?.accuracy ?? null,
        },
      ]),
    ),
    evidence_timestamps: evidenceTimestamps,
    moisture_readings: payload.moisture_readings.map((reading) => ({
      sequence: reading.sequence,
      moisture_reading: reading.moistureReading,
      notes: reading.notes,
      captured_at: reading.capturedAt,
      latitude: reading.latitude,
      longitude: reading.longitude,
      gps_accuracy: reading.accuracy,
    })),
  }));

  let uploaded = files.length - pendingFiles.length;
  for (const file of files) {
    if (file.upload_status === 'uploaded') {
      continue;
    }

    await updateOfflineFileStatus(file.id, 'uploading', { incrementAttempts: true, lastError: null });

    const fieldName =
      file.sequence_number != null
        ? `moisture_photos[${file.sequence_number}]`
        : `evidence_files[${file.evidence_type}]`;

    formData.append(
      fieldName,
      buildFormDataFilePart(file.local_uri, `${file.evidence_type}.jpg`, file.mime_type ?? 'image/jpeg') as unknown as Blob,
    );
    formData.append(`evidence_meta[${file.evidence_type}][evidence_type]`, file.evidence_type);
    if (file.sequence_number != null) {
      formData.append(`evidence_meta[${file.evidence_type}][sequence_number]`, String(file.sequence_number));
    }
    if (file.checksum) {
      formData.append(`evidence_meta[${file.evidence_type}][checksum]`, file.checksum);
    }

    const capturedAt =
      evidenceTimestamps[file.evidence_type] ??
      payload.moisture_readings.find((reading) => `moisture_reading_${reading.sequence}` === file.evidence_type)
        ?.capturedAt ??
      null;
    if (capturedAt) {
      formData.append(`evidence_meta[${file.evidence_type}][captured_at]`, capturedAt);
    }

    uploaded += 1;
    emit({
      submissionUuid: row.submission_uuid,
      status: 'syncing',
      uploadedFiles: uploaded,
      totalFiles: files.length,
      message: `Syncing ${uploaded} of ${files.length} images`,
    });
  }

  const response = await submitArtisanBiocharOfflinePackage(formData);
  const batch = (response.batch ?? response.record ?? response) as {
    id?: number;
    evidences?: Array<{ id?: number; evidence_type?: string; file_path?: string }>;
  };

  const serverBatchId = batch.id != null ? Number(batch.id) : null;
  for (const file of files) {
    const match = (batch.evidences ?? []).find((item) => item.evidence_type === file.evidence_type);
    await updateOfflineFileStatus(file.id, 'uploaded', {
      serverEvidenceId: match?.id != null ? Number(match.id) : null,
      serverPath: match?.file_path ?? null,
      lastError: null,
    });
  }

  await updateOfflineSubmissionStatus(row.submission_uuid, 'submitted_for_review', {
    serverBatchId,
    markSynced: true,
    lastError: null,
  });

  emit({
    submissionUuid: row.submission_uuid,
    status: 'submitted_for_review',
    uploadedFiles: files.length,
    totalFiles: files.length,
    message: 'Submitted for Review',
  });
}

export async function syncPendingBiocharProductions(artisanId?: number | null): Promise<number> {
  const id = artisanId ?? currentArtisanId;
  if (!id || syncing) {
    return 0;
  }

  if (!(await safeNetInfoIsConnected())) {
    return 0;
  }

  syncing = true;
  let synced = 0;

  try {
    const queue = await listSyncableSubmissions(id);
    for (const row of queue) {
      try {
        await syncOnePackage(row);
        synced += 1;
      } catch (error) {
        const raw = getApiErrorMessage(
          error,
          'Upload could not be completed. Your production record and all evidence are safely stored on this device.',
        );
        // Deduplicate repeated chronology/validation lines from API payloads.
        const message = [...new Set(raw.split(/\n+/).map((line) => line.trim()).filter(Boolean))].join('\n');
        await updateOfflineSubmissionStatus(row.submission_uuid, 'sync_failed', {
          lastError: message,
          incrementRetry: true,
        });
        emit({
          submissionUuid: row.submission_uuid,
          status: 'sync_failed',
          uploadedFiles: 0,
          totalFiles: 0,
          message,
        });
      }
    }
  } catch {
    return synced;
  } finally {
    syncing = false;
  }

  return synced;
}

export async function retryBiocharProductionSync(submissionUuid: string): Promise<void> {
  if (!currentArtisanId) {
    return;
  }

  await updateOfflineSubmissionStatus(submissionUuid, 'pending_sync', { lastError: null });
  await syncPendingBiocharProductions(currentArtisanId);
}

export function startBiocharProductionSyncListeners(artisanId: number | null): void {
  currentArtisanId = artisanId;
  if (started) {
    return;
  }
  started = true;

  void safeNetInfoAddEventListener((isConnected) => {
    if (isConnected) {
      void syncPendingBiocharProductions(currentArtisanId);
    }
  });

  try {
    let appState: AppStateStatus = AppState.currentState;
    AppState.addEventListener('change', (next) => {
      if (appState.match(/inactive|background/) && next === 'active') {
        void syncPendingBiocharProductions(currentArtisanId);
      }
      appState = next;
    });
  } catch {
    // AppState listener is best-effort.
  }
}
