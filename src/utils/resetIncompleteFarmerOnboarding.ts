import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFieldOfficerFarmerDetail } from '../api/fieldOfficerApi';
import type { OnboardingDraft } from '../context/OnboardingContext';
import { pickString } from './apiHelpers';
import { clearOnboardingDraftFiles } from './onboardingFilePersistence';
import { isDevelopmentBuild } from './localApiNetwork';
import { toPositiveEntityId } from './entityId';

export const ONBOARDING_DRAFT_STORAGE_KEY = '@bhuguard/onboarding-draft-v1';
export const BOUNDARY_DRAFT_STORAGE_KEY = 'bhuguard.boundary.draft.v1';

export interface IncompleteOnboardingBoundaryDraft {
  sessionMode?: string;
  farmerId?: number | null;
  farmId?: number | null;
}

export interface IncompleteOnboardingResetSnapshot {
  farmerId: number | null;
  farmId: number | null;
  onboardingSessionId: string | null;
  farmerName: string;
  mobile: string;
  boundaryMappingStatus: string;
  hasLocalDraftProgress: boolean;
}

export interface PartialBackendOnboardingRecord {
  exists: boolean;
  farmerId: number;
  farmId: number | null;
  onboardingStatus: string;
  isDraftLike: boolean;
}

export interface IncompleteOnboardingResetResult {
  snapshot: IncompleteOnboardingResetSnapshot;
  clearedStorageKeys: string[];
  clearedFileDirectory: string | null;
  boundaryDraftCleared: boolean;
  partialBackendRecord: PartialBackendOnboardingRecord | null;
}

function hasLocalOnboardingDraftProgress(draft: OnboardingDraft): boolean {
  return Boolean(
    draft.farmer_name.trim()
    || draft.mobile.trim()
    || draft.farmer_id
    || draft.farm_id
    || draft.onboarding_session_id.trim()
    || draft.boundary_points.length > 0
    || draft.farmer_photo
    || draft.proof_of_land_ownership
    || draft.farmer_with_farm_photo
    || draft.consent_form
    || draft.onboarding_evidences.length
    || draft.farmer_documents.length
    || draft.agreement_otp_request_id.trim()
    || draft.agreement_otp_verified,
  );
}

export function snapshotIncompleteOnboarding(draft: OnboardingDraft): IncompleteOnboardingResetSnapshot {
  return {
    farmerId: toPositiveEntityId(draft.farmer_id),
    farmId: toPositiveEntityId(draft.farm_id),
    onboardingSessionId: draft.onboarding_session_id.trim() || null,
    farmerName: draft.farmer_name.trim(),
    mobile: draft.mobile.trim(),
    boundaryMappingStatus: draft.boundary_mapping_status,
    hasLocalDraftProgress: hasLocalOnboardingDraftProgress(draft),
  };
}

export function shouldClearBoundaryDraftForOnboardingReset(
  snapshot: IncompleteOnboardingResetSnapshot,
  boundaryDraft: IncompleteOnboardingBoundaryDraft | null | undefined,
): boolean {
  if (!boundaryDraft) {
    return false;
  }

  if (boundaryDraft.sessionMode === 'onboarding') {
    return true;
  }

  if (snapshot.farmerId != null && boundaryDraft.farmerId === snapshot.farmerId) {
    return true;
  }

  if (snapshot.farmId != null && boundaryDraft.farmId === snapshot.farmId) {
    return true;
  }

  return false;
}

async function probePartialBackendRecord(
  farmerId: number,
  farmId: number | null,
): Promise<PartialBackendOnboardingRecord | null> {
  if (!isDevelopmentBuild()) {
    return null;
  }

  try {
    const response = await getFieldOfficerFarmerDetail(farmerId);
    const farmer = response.farmer;
    const onboardingStatus = pickString(farmer, 'onboarding_status');
    const normalizedStatus = onboardingStatus === '-' ? '' : onboardingStatus;
    const isDraftLike =
      normalizedStatus === ''
      || normalizedStatus === 'draft'
      || normalizedStatus === 'pending'
      || normalizedStatus === 'incomplete';

    return {
      exists: true,
      farmerId,
      farmId,
      onboardingStatus: normalizedStatus || 'unknown',
      isDraftLike,
    };
  } catch {
    return {
      exists: false,
      farmerId,
      farmId,
      onboardingStatus: 'not_found',
      isDraftLike: false,
    };
  }
}

export function logIncompleteOnboardingResetDiagnostics(
  snapshot: IncompleteOnboardingResetSnapshot,
  partialBackendRecord: PartialBackendOnboardingRecord | null,
): void {
  if (!__DEV__) {
    return;
  }

  console.log('[RESET ONBOARDING] snapshot:', {
    farmerId: snapshot.farmerId,
    farmId: snapshot.farmId,
    sessionId: snapshot.onboardingSessionId,
    boundaryMappingStatus: snapshot.boundaryMappingStatus,
    hasLocalDraftProgress: snapshot.hasLocalDraftProgress,
  });

  if (partialBackendRecord) {
    console.log('[RESET ONBOARDING] partial backend record (local reset only; no server delete):', partialBackendRecord);
  } else if (snapshot.farmerId != null) {
    console.log('[RESET ONBOARDING] no backend probe result for farmer', snapshot.farmerId);
  } else {
    console.log('[RESET ONBOARDING] no farmer_id on draft; backend probe skipped');
  }
}

export async function resetIncompleteFarmerOnboardingLocalState(
  snapshot: IncompleteOnboardingResetSnapshot,
  options: {
    clearBoundaryDraft?: boolean;
    probeBackend?: boolean;
  } = {},
): Promise<IncompleteOnboardingResetResult> {
  const clearedStorageKeys: string[] = [];
  let clearedFileDirectory: string | null = null;
  let boundaryDraftCleared = false;

  const partialBackendRecord =
    options.probeBackend !== false && snapshot.farmerId != null
      ? await probePartialBackendRecord(snapshot.farmerId, snapshot.farmId)
      : null;

  logIncompleteOnboardingResetDiagnostics(snapshot, partialBackendRecord);

  if (snapshot.onboardingSessionId) {
    clearedFileDirectory = `bhuguard/onboarding/${snapshot.onboardingSessionId}/`;
    await clearOnboardingDraftFiles(snapshot.onboardingSessionId);
  }

  await AsyncStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
  clearedStorageKeys.push(ONBOARDING_DRAFT_STORAGE_KEY);

  if (options.clearBoundaryDraft) {
    await AsyncStorage.removeItem(BOUNDARY_DRAFT_STORAGE_KEY);
    clearedStorageKeys.push(BOUNDARY_DRAFT_STORAGE_KEY);
    boundaryDraftCleared = true;
  }

  return {
    snapshot,
    clearedStorageKeys,
    clearedFileDirectory,
    boundaryDraftCleared,
    partialBackendRecord,
  };
}
