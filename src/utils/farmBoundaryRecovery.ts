import AsyncStorage from '@react-native-async-storage/async-storage';

import type { BoundaryPoint } from './boundaryGeometry';
import type { ManualDrawingPhase } from './manualBoundaryVisuals';

const RECOVERY_PREFIX = 'bhuguard.fo.boundary.recovery.v1.';

export interface FarmBoundaryRecoveryPayload {
  farmId: number;
  farmerId: number | null;
  vertices: BoundaryPoint[];
  phase: ManualDrawingPhase;
  mapCenter: { longitude: number; latitude: number } | null;
  timestamp: string;
}

function storageKey(farmId: number): string {
  return `${RECOVERY_PREFIX}${farmId}`;
}

export async function saveFarmBoundaryRecovery(payload: FarmBoundaryRecoveryPayload): Promise<void> {
  if (!payload.farmId || payload.vertices.length === 0) {
    return;
  }

  await AsyncStorage.setItem(storageKey(payload.farmId), JSON.stringify(payload));
}

export async function loadFarmBoundaryRecovery(farmId: number): Promise<FarmBoundaryRecoveryPayload | null> {
  if (!farmId) {
    return null;
  }

  const raw = await AsyncStorage.getItem(storageKey(farmId));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as FarmBoundaryRecoveryPayload;
    if (Number(parsed.farmId) !== Number(farmId) || !Array.isArray(parsed.vertices)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearFarmBoundaryRecovery(farmId: number): Promise<void> {
  if (!farmId) {
    return;
  }

  await AsyncStorage.removeItem(storageKey(farmId));
}
