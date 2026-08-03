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
  /** Captured once, locked thereafter — persisted so app restarts never re-prompt for a new value. */
  batchStartedAt?: string | null;
  processCompletedAt?: string | null;
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
  /** Farm id used for resume CTA when draft key farm segment is 0. */
  farmId?: number | null;
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

export interface IncompleteBiocharProductionDraftSummary {
  key: string;
  apiMode: 'officer' | 'farmer' | 'artisan';
  userId: number | null;
  farmerId: number | null;
  farmId: number | null;
  batchId: number | null;
  batchCode: string;
  savedAt: string;
}

function hasMeaningfulDraftProgress(draft: BiocharProductionLocalDraft): boolean {
  return Boolean(
    draft.batchCode?.trim() ||
      draft.batchStartedAt ||
      draft.feedstockQuantity?.trim() ||
      Object.keys(draft.evidence ?? {}).length > 0 ||
      (draft.moistureReadings ?? []).some((reading) => reading.moistureReading?.trim() || reading.photo),
  );
}

/**
 * Scans local drafts for the given user/mode and returns the most recently
 * saved one that still has meaningful (unsaved-to-server) progress. Used to
 * silently resume and to power the "Complete the Process" dashboard highlight
 * — never shows a resume dialog, just detects whether one exists.
 */
export async function findIncompleteBiocharProductionDraft(params: {
  apiMode: 'officer' | 'farmer' | 'artisan';
  userId?: number | null;
}): Promise<IncompleteBiocharProductionDraftSummary | null> {
  const prefix = `${DRAFT_PREFIX}:${params.apiMode}:u${params.userId ?? 0}:`;

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const matchingKeys = allKeys.filter((key) => key.startsWith(prefix));

    let best: IncompleteBiocharProductionDraftSummary | null = null;

    for (const key of matchingKeys) {
      const draft = await loadBiocharProductionDraft(key);
      if (!draft || !hasMeaningfulDraftProgress(draft)) {
        continue;
      }

      const segments = key.slice(prefix.length).split(':');
      const [farmerIdRaw, farmIdRaw, batchIdRaw] = segments;
      const farmerId = Number(farmerIdRaw);
      const farmId = Number(farmIdRaw);
      const batchId = batchIdRaw && batchIdRaw !== 'new' ? Number(batchIdRaw) : draft.batchId ?? null;

      const summary: IncompleteBiocharProductionDraftSummary = {
        key,
        apiMode: params.apiMode,
        userId: params.userId ?? null,
        farmerId: Number.isFinite(farmerId) && farmerId > 0 ? farmerId : draft.selectedFarmerId ?? null,
        farmId: Number.isFinite(farmId) && farmId > 0
          ? farmId
          : (draft.farmId != null && draft.farmId > 0 ? draft.farmId : null),
        batchId: batchId != null && Number.isFinite(batchId) && batchId > 0 ? batchId : null,
        batchCode: draft.batchCode ?? '',
        savedAt: draft.savedAt,
      };

      if (!best || Date.parse(summary.savedAt || '') > Date.parse(best.savedAt || '')) {
        best = summary;
      }
    }

    return best;
  } catch {
    return null;
  }
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
