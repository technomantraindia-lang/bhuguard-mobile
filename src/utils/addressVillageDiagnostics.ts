import { API_BASE_URL } from '../config/env';

export function logWorkingAreaDiagnostics(input: {
  districtId: number;
  talukaCount: number;
  talukaNames: string[];
}): void {
  if (!__DEV__) {
    return;
  }

  console.log('[WORKING AREA] district id:', input.districtId);
  console.log('[WORKING AREA] taluka count:', input.talukaCount);
  console.log('[WORKING AREA] taluka names:', input.talukaNames.join(', '));
}

export function logVillageLoadDiagnostics(input: {
  talukaId: number;
  talukaName?: string;
  count: number;
  entireCityOptions?: number;
}): void {
  if (!__DEV__) {
    return;
  }

  const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/address/villages?taluka_id=${input.talukaId}`;
  console.log('[VILLAGES] selected taluka id:', input.talukaId);
  if (input.talukaName?.trim()) {
    console.log('[VILLAGES] selected taluka name:', input.talukaName.trim());
  }
  console.log('[VILLAGES] API endpoint:', endpoint);
  console.log('[VILLAGES] received count:', input.count);
  if (typeof input.entireCityOptions === 'number') {
    console.log('[VILLAGES] entire city options:', input.entireCityOptions);
  }
}

export function formatVillageEmptyMessage(talukaName?: string): string {
  const label = talukaName?.trim();
  if (label) {
    return `No villages available for ${label}.`;
  }
  return 'No villages available for the selected taluka.';
}
