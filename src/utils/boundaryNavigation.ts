export function resolveBoundaryFarmId(params: unknown): number | undefined {
  if (!params || typeof params !== 'object') {
    return undefined;
  }

  const farmId = (params as { farmId?: number | string }).farmId;

  if (farmId === undefined || farmId === null || farmId === '') {
    return undefined;
  }

  const parsed = Number(farmId);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function boundaryRouteParams(farmId?: number): { farmId: number } {
  return { farmId: farmId && farmId > 0 ? farmId : 0 };
}
