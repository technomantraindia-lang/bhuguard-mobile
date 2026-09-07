import type { AssignedLocationsPayload, AssignedTalukaScope } from '../types/assignedLocations';
import { entireCityDisplayLabel, ENTIRE_CITY_STORED_LABEL } from './workingAreaScope';
import { pickString, type ApiRecord } from './apiHelpers';

function uniqueNames(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function resolveLocations(
  assigned: AssignedLocationsPayload | null | undefined,
  dashboard?: ApiRecord | null,
): AssignedLocationsPayload {
  const fromDashboard = (dashboard?.assigned_area ?? dashboard?.assignedArea) as ApiRecord | undefined;

  const districts = uniqueNames([
    ...(assigned?.districts ?? []).map((item) => item.name),
    ...(Array.isArray(fromDashboard?.districts)
      ? (fromDashboard.districts as Array<{ name?: string }>).map((item) => item.name)
      : []),
  ]);

  const talukas = uniqueNames([
    ...(assigned?.talukas ?? []).map((item) => item.name),
    ...(Array.isArray(fromDashboard?.talukas)
      ? (fromDashboard.talukas as Array<{ name?: string }>).map((item) => item.name)
      : []),
  ]);

  const villages = uniqueNames([
    ...(assigned?.villages ?? []).map((item) => item.name),
    ...(Array.isArray(fromDashboard?.villages)
      ? (fromDashboard.villages as Array<{ name?: string }>).map((item) => item.name)
      : []),
  ]);

  const talukaScopes = [
    ...(assigned?.taluka_scopes ?? []),
    ...(Array.isArray(fromDashboard?.taluka_scopes)
      ? (fromDashboard.taluka_scopes as AssignedTalukaScope[])
      : []),
  ];

  const fullCityTalukaIds = new Set<number>([
    ...(assigned?.work_full_city_taluka_ids ?? []),
    ...(Array.isArray(fromDashboard?.work_full_city_taluka_ids)
      ? (fromDashboard.work_full_city_taluka_ids as number[])
      : []),
  ]);

  for (const scope of talukaScopes) {
    const scopeLabel = String(scope.scope ?? scope.label ?? '').toLowerCase();
    if (scopeLabel.includes('city') || scopeLabel.includes('taluka') || scopeLabel.includes('entire')) {
      fullCityTalukaIds.add(Math.abs(scope.id));
    }
  }

  const cityScopeLabels = uniqueNames(
    talukaScopes
      .map((scope) => {
        const scopeLabel = String(scope.label ?? scope.scope ?? '').trim();
        if (scopeLabel) {
          return scopeLabel.includes(ENTIRE_CITY_STORED_LABEL)
            ? scopeLabel
            : entireCityDisplayLabel(scope.name);
        }
        return fullCityTalukaIds.has(Math.abs(scope.id)) ? entireCityDisplayLabel(scope.name) : null;
      })
      .filter(Boolean),
  );

  for (const taluka of assigned?.talukas ?? []) {
    if (fullCityTalukaIds.has(Math.abs(taluka.id))) {
      cityScopeLabels.push(entireCityDisplayLabel(taluka.name));
    }
  }

  const resolvedCityScopes = uniqueNames(cityScopeLabels);
  const regularVillages = villages.filter((name) => name !== ENTIRE_CITY_STORED_LABEL);

  return {
    has_assignment:
      assigned?.has_assignment === true ||
      dashboard?.has_assignment === true ||
      districts.length > 0 ||
      talukas.length > 0 ||
      regularVillages.length > 0 ||
      resolvedCityScopes.length > 0,
    districts: districts.map((name, index) => ({ id: index + 1, name })),
    talukas: talukas.map((name, index) => ({ id: index + 1, name })),
    villages: regularVillages.map((name, index) => ({ id: index + 1, name, taluka_id: 0 })),
    taluka_scopes: talukaScopes,
    work_full_city_taluka_ids: Array.from(fullCityTalukaIds),
  };
}

export function buildArtisanWorkingAreaSummary(
  assigned: AssignedLocationsPayload | null | undefined,
  dashboard?: ApiRecord | null,
  profile?: ApiRecord | null,
): string {
  const resolved = resolveLocations(assigned, dashboard);
  const districts = resolved.districts.map((item) => item.name);
  const talukas = resolved.talukas.map((item) => item.name);
  const villages = resolved.villages.map((item) => item.name);
  const cityScopes = uniqueNames(
    (resolved.taluka_scopes ?? [])
      .map((scope) => {
        const label = String(scope.label ?? '').trim();
        if (label) {
          return label;
        }
        if ((resolved.work_full_city_taluka_ids ?? []).includes(Math.abs(scope.id))) {
          return entireCityDisplayLabel(scope.name);
        }
        return null;
      })
      .concat(
        talukas
          .filter((name) =>
            (resolved.work_full_city_taluka_ids ?? []).some((id) => {
              const match = (assigned?.talukas ?? []).find((item) => item.id === id);
              return match?.name === name;
            }),
          )
          .map((name) => entireCityDisplayLabel(name)),
      ),
  );

  const parts: string[] = [];

  if (districts.length > 0) {
    parts.push(
      `${districts.length} district${districts.length === 1 ? '' : 's'}: ${districts.slice(0, 2).join(', ')}`,
    );
  }

  if (cityScopes.length > 0) {
    parts.push(
      `${cityScopes.length} city scope${cityScopes.length === 1 ? '' : 's'}: ${cityScopes.slice(0, 2).join(', ')}`,
    );
  } else if (talukas.length > 0) {
    parts.push(
      `${talukas.length} taluka${talukas.length === 1 ? '' : 's'}: ${talukas.slice(0, 2).join(', ')}`,
    );
  }

  if (villages.length > 0) {
    parts.push(
      `${villages.length} village${villages.length === 1 ? '' : 's'}: ${villages.slice(0, 3).join(', ')}`,
    );
  }

  if (parts.length > 0) {
    return parts.join(' · ');
  }

  if (resolved.has_assignment) {
    return 'Assigned area configured';
  }

  const profileVillage = pickString(profile ?? {}, 'village');
  if (profileVillage !== '-') {
    return profileVillage;
  }

  return 'No assigned area yet';
}
