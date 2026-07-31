import AsyncStorage from '@react-native-async-storage/async-storage';

import type { FarmerFarmActivityEvidenceAsset } from '../utils/farmerFarmActivityEvidencePersistence';

const DRAFT_PREFIX = 'bhuguard_farmer_farm_activity_draft';

export interface FarmerFarmActivityLocalDraft {
  savedAt: string;
  draftUuid: string;
  userId?: number | null;
  farmerId: number;
  farmId: number | null;
  activityId: number | null;
  activityDate: string;
  capturedAt: string | null;
  timezone: string | null;
  utcOffset: string | null;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  evidence: FarmerFarmActivityEvidenceAsset | null;
}

export function buildFarmerFarmActivityDraftKey(params: {
  userId?: number | null;
  farmerId?: number | null;
  farmId?: number | null;
  activityId?: number | null;
}): string {
  return `${DRAFT_PREFIX}:u${params.userId ?? 0}:f${params.farmerId ?? 0}:farm${params.farmId ?? 0}:a${params.activityId ?? 'new'}`;
}

export async function loadFarmerFarmActivityDraft(key: string): Promise<FarmerFarmActivityLocalDraft | null> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FarmerFarmActivityLocalDraft;
  } catch {
    return null;
  }
}

export async function saveFarmerFarmActivityDraftLocal(
  key: string,
  draft: FarmerFarmActivityLocalDraft,
): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(draft));
}

export async function clearFarmerFarmActivityDraft(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function migrateFarmerFarmActivityDraft(fromKey: string, toKey: string): Promise<void> {
  if (fromKey === toKey) {
    return;
  }

  const draft = await loadFarmerFarmActivityDraft(fromKey);

  if (!draft) {
    return;
  }

  await saveFarmerFarmActivityDraftLocal(toKey, draft);
  await clearFarmerFarmActivityDraft(fromKey);
}
