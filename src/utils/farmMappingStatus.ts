import { getFieldOfficerFarmMapping } from '../api/fieldOfficerApi';

/**
 * Refresh Field Officer farm mapping status from the Laravel API.
 * Farm Mapping stays in-app (FarmBoundaryMap) — no Chrome / web session.
 */
export async function refreshFarmMappingStatus(
  farmerId: number | string,
  farmId: number | string,
): Promise<{ mapped: boolean; status: string | null }> {
  try {
    const data = (await getFieldOfficerFarmMapping(farmerId, farmId)) as Record<string, unknown>;
    const boundary = (data.boundary ?? data.mapping ?? data) as Record<string, unknown>;
    const status = String(
      boundary?.status
      ?? boundary?.mapping_status
      ?? data?.boundary_status
      ?? data?.mapping_status
      ?? '',
    ).toLowerCase();
    const mapped = ['mapped', 'completed', 'submitted'].includes(status);
    return { mapped, status: status || null };
  } catch {
    return { mapped: false, status: null };
  }
}
