import * as FileSystem from 'expo-file-system/legacy';

import type { FileAsset, OnboardingDraft } from '../context/OnboardingContext';
import { createLocalMediaUuid, guessImageExtension, localEvidenceFileExists } from './biocharEvidencePersistence';
import { draftAlreadyHasFarmerFarm } from './ensureOnboardingFarmerFarm';

export type OnboardingFileCategory =
  | 'profile'
  | 'ownership'
  | 'farm'
  | 'farmer-with-farm'
  | 'evidence'
  | 'consent';

export type OnboardingFileAvailability = 'available' | 'missing' | 'remote';

export interface OnboardingFileAuditItem {
  id: string;
  label: string;
  status: OnboardingFileAvailability;
  required: boolean;
  editScreen: 'FarmerBasicDetails' | 'FarmerProofUpload' | 'FarmerConsent';
  file: FileAsset | null;
}

const ONBOARDING_STORAGE_PREFIX = 'bhuguard/onboarding/';

export function createOnboardingSessionId(): string {
  return `onb-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function resolveOnboardingSessionId(draft: OnboardingDraft): {
  sessionId: string;
  sessionPatch: Partial<OnboardingDraft> | null;
} {
  const existing = draft.onboarding_session_id?.trim();
  if (existing) {
    return { sessionId: existing, sessionPatch: null };
  }

  const sessionId = createOnboardingSessionId();
  return {
    sessionId,
    sessionPatch: { onboarding_session_id: sessionId },
  };
}

function onboardingStorageRoot(sessionId: string): string {
  const root = FileSystem.documentDirectory;
  if (!root) {
    throw new Error('Persistent document storage is unavailable on this device.');
  }
  return `${root}${ONBOARDING_STORAGE_PREFIX}${sessionId}/`;
}

function categoryDirectory(sessionId: string, category: OnboardingFileCategory): string {
  return `${onboardingStorageRoot(sessionId)}${category}/`;
}

function isPersistentOnboardingUri(uri: string): boolean {
  return uri.includes(`/${ONBOARDING_STORAGE_PREFIX}`);
}

export function resolveOnboardingFileUri(file: FileAsset | null | undefined): string {
  if (!file) {
    return '';
  }

  return (file.localUri || file.uri || '').trim();
}

async function fileExistsAtUri(uri: string | null | undefined): Promise<boolean> {
  if (!uri?.trim()) {
    return false;
  }

  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return true;
  }

  return localEvidenceFileExists(uri);
}

export async function isOnboardingFileAvailable(file: FileAsset | null | undefined): Promise<boolean> {
  if (!file) {
    return false;
  }

  if (file.uploadStatus === 'uploaded' && file.backendEvidenceId != null) {
    return true;
  }

  const uri = resolveOnboardingFileUri(file);
  return fileExistsAtUri(uri);
}

export async function persistOnboardingCapturedFile(
  sessionId: string,
  category: OnboardingFileCategory,
  file: Pick<FileAsset, 'uri' | 'name' | 'mimeType' | 'size' | 'localUri' | 'uploadStatus'> & {
    isStamped?: boolean;
    capturedAt?: string;
  },
): Promise<FileAsset> {
  const sourceUri = file.uri?.trim();
  if (!sourceUri) {
    throw new Error('Cannot persist onboarding file without a source URI.');
  }

  if (
    file.localUri
    && isPersistentOnboardingUri(file.localUri)
    && (await fileExistsAtUri(file.localUri))
  ) {
    return {
      ...file,
      uri: file.localUri,
      localUri: file.localUri,
      uploadStatus: file.uploadStatus ?? 'local_pending',
    };
  }

  const directory = categoryDirectory(sessionId, category);
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const localMediaUuid = createLocalMediaUuid();
  const extension = guessImageExtension(sourceUri, file.mimeType || 'image/jpeg');
  const destination = `${directory}${category}-${localMediaUuid}.${extension}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destination,
  });

  const info = await FileSystem.getInfoAsync(destination);
  const size =
    info.exists && 'size' in info && typeof info.size === 'number'
      ? info.size
      : file.size;

  return {
    uri: destination,
    localUri: destination,
    name: file.name,
    mimeType: file.mimeType || 'image/jpeg',
    size,
    localMediaUuid,
    persistedAt: new Date().toISOString(),
    uploadStatus: 'local_pending',
    isStamped: file.isStamped,
    capturedAt: file.capturedAt,
  };
}

export async function ensurePersistedOnboardingFile(
  sessionId: string,
  category: OnboardingFileCategory,
  file: FileAsset | null,
): Promise<FileAsset | null> {
  if (!file) {
    return null;
  }

  const uri = resolveOnboardingFileUri(file);
  if (file.uploadStatus === 'uploaded' && file.backendEvidenceId != null) {
    return file;
  }

  if (isPersistentOnboardingUri(uri) && (await fileExistsAtUri(uri))) {
    return {
      ...file,
      uri,
      localUri: uri,
    };
  }

  if (!(await fileExistsAtUri(uri))) {
    return file;
  }

  return persistOnboardingCapturedFile(sessionId, category, file);
}

async function repairFile(
  sessionId: string,
  category: OnboardingFileCategory,
  file: FileAsset | null,
): Promise<FileAsset | null> {
  if (!file) {
    return null;
  }

  try {
    return await ensurePersistedOnboardingFile(sessionId, category, file);
  } catch (error) {
    if (__DEV__) {
      console.warn('[ONBOARDING FILES] repair failed for category', category, error);
    }
    return file;
  }
}

export async function repairOnboardingDraftFiles(draft: OnboardingDraft): Promise<OnboardingDraft> {
  const { sessionId, sessionPatch } = resolveOnboardingSessionId(draft);
  const next: OnboardingDraft = {
    ...draft,
    ...(sessionPatch ?? {}),
  };

  next.farmer_photo = await repairFile(sessionId, 'profile', next.farmer_photo);
  next.proof_of_land_ownership = await repairFile(sessionId, 'ownership', next.proof_of_land_ownership);
  next.farmer_with_farm_photo = await repairFile(sessionId, 'farmer-with-farm', next.farmer_with_farm_photo);
  next.consent_form = await repairFile(sessionId, 'consent', next.consent_form);

  next.farmer_documents = await Promise.all(
    next.farmer_documents.map((file) => repairFile(sessionId, 'farm', file)),
  ).then((files) => files.filter(Boolean) as FileAsset[]);

  next.onboarding_evidences = await Promise.all(
    next.onboarding_evidences.map((file) => repairFile(sessionId, 'evidence', file)),
  ).then((files) => files.filter(Boolean) as FileAsset[]);

  next.consent_documents = await Promise.all(
    next.consent_documents.map((file) => repairFile(sessionId, 'consent', file)),
  ).then((files) => files.filter(Boolean) as FileAsset[]);

  return next;
}

function isOwnershipRequired(draft: OnboardingDraft): boolean {
  return draft.ownership_type === 'owned';
}

export async function auditOnboardingDraftFiles(
  draft: OnboardingDraft,
  preparedDraft = draftAlreadyHasFarmerFarm(draft),
): Promise<OnboardingFileAuditItem[]> {
  const items: OnboardingFileAuditItem[] = [];

  const push = async (
    id: string,
    label: string,
    file: FileAsset | null,
    required: boolean,
    editScreen: OnboardingFileAuditItem['editScreen'],
  ) => {
    if (!file && !required) {
      return;
    }

    let status: OnboardingFileAvailability = 'missing';
    if (file) {
      if (file.uploadStatus === 'uploaded' && file.backendEvidenceId != null) {
        status = 'remote';
      } else if (await isOnboardingFileAvailable(file)) {
        status = 'available';
      }
    }

    items.push({
      id,
      label,
      status,
      required,
      editScreen,
      file,
    });
  };

  if (!preparedDraft) {
    await push('farmer_photo', 'Profile Photo', draft.farmer_photo, true, 'FarmerBasicDetails');
  }

  await push(
    'proof_of_land_ownership',
    'Ownership Document',
    draft.proof_of_land_ownership,
    isOwnershipRequired(draft),
    'FarmerProofUpload',
  );

  if (draft.farmer_documents.length === 0) {
    await push('farmer_documents', 'Farm Photos', null, true, 'FarmerProofUpload');
  } else {
    for (let index = 0; index < draft.farmer_documents.length; index += 1) {
      await push(
        `farmer_documents_${index}`,
        `Farm Photo ${index + 1}`,
        draft.farmer_documents[index] ?? null,
        true,
        'FarmerProofUpload',
      );
    }
  }

  await push(
    'farmer_with_farm_photo',
    'Farmer with Farm Photo',
    draft.farmer_with_farm_photo,
    true,
    'FarmerProofUpload',
  );

  if (draft.onboarding_evidences.length === 0 && !draft.consent_form) {
    await push('consent_evidence', 'Agreement Evidence', null, true, 'FarmerConsent');
  } else {
    if (draft.consent_form) {
      await push('consent_form', 'Consent Form', draft.consent_form, false, 'FarmerConsent');
    }
    for (let index = 0; index < draft.onboarding_evidences.length; index += 1) {
      await push(
        `onboarding_evidences_${index}`,
        `Agreement Evidence ${index + 1}`,
        draft.onboarding_evidences[index] ?? null,
        index === 0,
        'FarmerConsent',
      );
    }
  }

  return items;
}

export function formatMissingOnboardingFilesMessage(items: OnboardingFileAuditItem[]): string {
  const missing = items.filter((item) => item.required && item.status === 'missing');
  if (missing.length === 0) {
    return '';
  }

  const lines = missing.map((item) => `- ${item.label}`);
  return `Missing files:\n${lines.join('\n')}\n\nRe-capture the missing files from the steps below, then retry registration.`;
}

export function formatSingleMissingFileMessage(label: string): string {
  return `${label} needs to be re-captured.`;
}

export async function clearOnboardingDraftFiles(sessionId: string): Promise<void> {
  const directory = onboardingStorageRoot(sessionId);
  try {
    const info = await FileSystem.getInfoAsync(directory);
    if (info.exists) {
      await FileSystem.deleteAsync(directory, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup after successful submit.
  }
}

export async function persistOnboardingDraftPatch(
  draft: OnboardingDraft,
  category: OnboardingFileCategory,
  file: Pick<FileAsset, 'uri' | 'name' | 'mimeType' | 'size'> & {
    isStamped?: boolean;
    capturedAt?: string;
  } | null,
): Promise<Partial<OnboardingDraft>> {
  const { sessionId, sessionPatch } = resolveOnboardingSessionId(draft);
  const patch: Partial<OnboardingDraft> = { ...(sessionPatch ?? {}) };

  if (!file) {
    return patch;
  }

  const persisted = await persistOnboardingCapturedFile(sessionId, category, file);
  return patch;
}

export async function attachPersistedOnboardingFile(
  draft: OnboardingDraft,
  category: OnboardingFileCategory,
  incoming: Pick<FileAsset, 'uri' | 'name' | 'mimeType' | 'size'> & {
    isStamped?: boolean;
    capturedAt?: string;
  },
): Promise<{ file: FileAsset; sessionPatch: Partial<OnboardingDraft> }> {
  const { sessionId, sessionPatch } = resolveOnboardingSessionId(draft);
  const file = await persistOnboardingCapturedFile(sessionId, category, incoming);
  return {
    file,
    sessionPatch: sessionPatch ?? {},
  };
}
