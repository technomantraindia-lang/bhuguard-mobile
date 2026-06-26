import { extractList, pickNestedString, pickString, type ApiRecord } from './apiHelpers';
import {
  buildActivitiesSummary,
  mapActivityRecord,
  type FarmerActivitiesSummary,
  type FarmerActivityViewModel,
} from './farmerActivityHelpers';
import {
  getFarmAreaLabel,
  getFarmCode,
  getFarmCoordinates,
  getFarmLocationLabel,
  getFarmVerificationBadge,
  isFarmMapped,
  mapFarmRecord,
  type FarmerFarmViewModel,
} from './farmMapHelpers';
import { formatCoordinatePair, getDemoCenter, parseFarmPolygon } from './farmSatelliteMap';

export interface FarmCarbonProgress {
  estimatedLabel: string;
  targetLabel: string;
  progressPercent: number;
}

export interface FarmVerificationStep {
  id: string;
  label: string;
  completed: boolean;
}

export interface FarmDetailViewModel {
  farm: FarmerFarmViewModel;
  farmName: string;
  farmCode: string;
  statusLabel: string;
  verificationLabel: string;
  projectName: string;
  areaLabel: string;
  locationLabel: string;
  surveyNumber: string;
  cropLabel: string;
  soilLabel: string;
  irrigationLabel: string;
  mappedLabel: string;
  coordinatesLabel: string;
  enrollmentDate: string;
  carbonProgramLabel: string;
  fieldOfficerName: string;
  activitySummary: FarmerActivitiesSummary;
  recentActivities: FarmerActivityViewModel[];
  carbonProgress: FarmCarbonProgress;
  verificationSteps: FarmVerificationStep[];
  polygonCoordinatesLabel: string;
  centerCoordinates: { latitude: number; longitude: number };
}

function titleCase(value: string): string {
  if (!value || value === '-') {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseAcres(farm: ApiRecord): number {
  const area = Number(farm.land_area ?? farm.area_acres);

  if (Number.isFinite(area) && area > 0) {
    return area;
  }

  return 0;
}

function buildVerificationSteps(farm: ApiRecord): FarmVerificationStep[] {
  const mapped = isFarmMapped(farm);
  const status = pickString(farm, 'status', 'verification_status').toLowerCase();
  const verified = ['verified', 'active', 'approved'].includes(status);

  return [
    { id: 'registered', label: 'Farm Registered', completed: true },
    { id: 'gps', label: 'GPS Mapped', completed: mapped },
    { id: 'project', label: 'Project Approved', completed: verified },
    { id: 'field', label: 'Field Verification Completed', completed: verified },
    { id: 'monitoring', label: 'Monitoring Active', completed: verified },
    { id: 'carbon', label: 'Carbon Monitoring Running', completed: verified },
  ];
}

function buildCarbonProgress(farm: ApiRecord, carbonRecords: ApiRecord[]): FarmCarbonProgress {
  const farmCarbon = carbonRecords.find((record) => Number(record.farm_id) === Number(farm.id));

  const estimated = Number(
    farmCarbon?.estimated_co2e ?? farmCarbon?.estimated_carbon_credits ?? farm.estimated_co2e ?? 0,
  );
  const target = Number(farmCarbon?.target_co2e ?? farmCarbon?.target_carbon_credits ?? 0);

  const safeEstimated = Number.isFinite(estimated) && estimated > 0 ? estimated : 0;
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 0;
  const progressPercent =
    safeTarget > 0 ? Math.min(100, Math.round((safeEstimated / safeTarget) * 100)) : 0;

  return {
    estimatedLabel: `${safeEstimated.toFixed(1)} tCO₂e`,
    targetLabel: `${safeTarget.toFixed(0)} tCO₂e`,
    progressPercent,
  };
}

export function buildFarmDetailViewModel(
  farmRecord: ApiRecord,
  activityRecords: ApiRecord[],
  carbonRecords: ApiRecord[] = [],
): FarmDetailViewModel {
  const farm = mapFarmRecord(farmRecord);
  const farmId = Number(farmRecord.id);
  const farmNameById = new Map<number, string>([[farmId, farm.name]]);
  const activities = extractList({ activity_logs: activityRecords }, ['activity_logs'])
    .map((record) => mapActivityRecord(record, farmNameById))
    .filter((item): item is FarmerActivityViewModel => item !== null)
    .filter((activity) => activity.farmId === farmId || activity.farmId === 0);

  const allActivities = activities;

  const activitySummary = buildActivitiesSummary(allActivities, []);

  const coordinates = getFarmCoordinates(farmRecord) ?? getDemoCenter();
  const acres = parseAcres(farmRecord);
  const polygon = parseFarmPolygon(farmRecord, coordinates, acres);
  const verificationBadge = getFarmVerificationBadge(farmRecord);

  const areaLabel = getFarmAreaLabel(farmRecord);

  return {
    farm,
    farmName: farm.name,
    farmCode: farm.code,
    statusLabel: titleCase(pickString(farmRecord, 'status') !== '-' ? pickString(farmRecord, 'status') : '—'),
    verificationLabel:
      verificationBadge === 'verified'
        ? 'Verified'
        : verificationBadge === 'pending'
          ? 'Pending'
          : 'Draft',
    projectName:
      pickString(farmRecord, 'project_name', 'service_name') !== '-'
        ? pickString(farmRecord, 'project_name', 'service_name')
        : '—',
    areaLabel: areaLabel === '—' ? 'Not set' : areaLabel,
    locationLabel:
      getFarmLocationLabel(farmRecord) !== 'Location not set'
        ? getFarmLocationLabel(farmRecord)
        : 'Location not set',
    surveyNumber:
      pickString(farmRecord, 'land_survey_number', 'survey_number') !== '-'
        ? pickString(farmRecord, 'land_survey_number', 'survey_number')
        : '—',
    cropLabel: farm.cropLabel !== '—' ? farm.cropLabel : '—',
    soilLabel: farm.soilLabel !== '—' ? farm.soilLabel : '—',
    irrigationLabel:
      pickString(farmRecord, 'irrigation_type') !== '-'
        ? titleCase(pickString(farmRecord, 'irrigation_type'))
        : '—',
    mappedLabel: isFarmMapped(farmRecord) ? 'Yes' : 'No',
    coordinatesLabel: formatCoordinatePair(coordinates),
    enrollmentDate:
      pickString(farmRecord, 'enrollment_date', 'created_at') !== '-'
        ? pickString(farmRecord, 'enrollment_date', 'created_at')
        : '—',
    carbonProgramLabel: pickString(farmRecord, 'carbon_program_status') !== '-'
      ? pickString(farmRecord, 'carbon_program_status')
      : '—',
    fieldOfficerName:
      pickNestedString(farmRecord, 'field_officer.name') !== '-'
        ? pickNestedString(farmRecord, 'field_officer.name')
        : '—',
    activitySummary,
    recentActivities: allActivities.slice(0, 3),
    carbonProgress: buildCarbonProgress(farmRecord, carbonRecords),
    verificationSteps: buildVerificationSteps(farmRecord),
    polygonCoordinatesLabel: polygon
      .map((point) => `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`)
      .join(' · '),
    centerCoordinates: coordinates,
  };
}
