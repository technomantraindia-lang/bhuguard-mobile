import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import type { BiocharEvidenceKey } from '../constants/biocharProduction';

const DRAFT_PREFIX = 'bhuguard_biochar_production_draft';

interface BiocharMoistureReadingDraftSnapshot {
  key: string;
  sequence?: number;
  moistureReading: string;
  notes: string;
  photo?: BiocharEvidenceAsset;
  readingId?: number | null;
  evidenceId?: number | null;
  uploadStatus?: 'idle' | 'local_pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string | null;
}

export interface BiocharProductionLocalDraft {
  savedAt: string;
  draftUuid: string;
  userId?: number | null;
  batchId: number | null;
  productionRecordCode: string;
  batchCode: string;
  selectedFarmerId: number | null;
  selectedUnitId: number | null;
  kilnId: string;
  farmerName: string;
  productionDate: string;
  operatorName: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  gpsCapturedAt: string | null;
  altitude: number | null;
  timestampDate: string;
  timestampTime: string;
  finalStageTime: string;
  quenchingTime: string;
  villageName: string;
  talukaName: string;
  districtName: string;
  stateName: string;
  feedstockQuantity: string;
  feedstockUnit: string;
  feedstockType: string;
  moistureValue: string;
  moistureReadings: BiocharMoistureReadingDraftSnapshot[];
  startTime: string;
  endTime: string;
  temperature: string;
  residenceTime: string;
  biocharOutput: string;
  biocharOutputUnit: 'kg' | 'ton';
  officerNotes: string;
  evidence: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>;
}

export function buildBiocharProductionDraftKey(params: {
  apiMode: 'officer' | 'farmer' | 'artisan';
  userId?: number | null;
  farmerId?: number;
  farmId?: number;
  batchId?: number | null;
}): string {
  return `${DRAFT_PREFIX}:${params.apiMode}:u${params.userId ?? 0}:${params.farmerId ?? 0}:${params.farmId ?? 0}:${params.batchId ?? 'new'}`;
}

export async function loadBiocharProductionDraft(key: string): Promise<BiocharProductionLocalDraft | null> {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BiocharProductionLocalDraft;
  } catch {
    return null;
  }
}

export async function saveBiocharProductionDraft(key: string, draft: BiocharProductionLocalDraft): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(draft));
}

export async function clearBiocharProductionDraft(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function migrateBiocharProductionDraft(fromKey: string, toKey: string): Promise<void> {
  if (fromKey === toKey) {
    return;
  }

  const draft = await loadBiocharProductionDraft(fromKey);

  if (!draft) {
    return;
  }

  await saveBiocharProductionDraft(toKey, draft);
  await clearBiocharProductionDraft(fromKey);
}
