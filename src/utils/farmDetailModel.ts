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

  return 12.45;
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
    farmCarbon?.estimated_co2e ?? farmCarbon?.estimated_carbon_credits ?? farm.estimated_co2e ?? 14.8,
  );
  const target = Number(farmCarbon?.target_co2e ?? farmCarbon?.target_carbon_credits ?? 25);

  const safeEstimated = Number.isFinite(estimated) && estimated > 0 ? estimated : 14.8;
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 25;
  const progressPercent = Math.min(100, Math.round((safeEstimated / safeTarget) * 100));

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

  const allActivities =
    activities.length > 0
      ? activities
      : [
          {
            id: 1,
            farmId,
            title: 'Crop Sowing',
            emoji: '🌱',
            farmName: farm.name,
            dateLabel: '10 Jan 2026',
            sortKey: 3,
            status: 'approved' as const,
            statusLabel: 'Approved',
            evidencePhotoCount: 2,
            evidenceLabel: '2 photos',
            fieldOfficerName: 'Rakesh Patel',
            remark: null,
            hasGps: true,
          },
          {
            id: 2,
            farmId,
            title: 'Biochar Application',
            emoji: '♻️',
            farmName: farm.name,
            dateLabel: '18 Jan 2026',
            sortKey: 2,
            status: 'under_review' as const,
            statusLabel: 'Under Review',
            evidencePhotoCount: 3,
            evidenceLabel: '3 photos',
            fieldOfficerName: 'Rakesh Patel',
            remark: null,
            hasGps: true,
          },
          {
            id: 3,
            farmId,
            title: 'Irrigation',
            emoji: '💧',
            farmName: farm.name,
            dateLabel: '25 Jan 2026',
            sortKey: 1,
            status: 'approved' as const,
            statusLabel: 'Approved',
            evidencePhotoCount: 1,
            evidenceLabel: '1 photo',
            fieldOfficerName: 'Rakesh Patel',
            remark: null,
            hasGps: false,
          },
        ];

  const activitySummary =
    activities.length > 0
      ? buildActivitiesSummary(allActivities, [])
      : {
          submitted: 28,
          approved: 20,
          underReview: 5,
          correctionRequired: 3,
          verified: 20,
          pending: 8,
          photosUploaded: 42,
          documentsUploaded: 6,
          gpsCapturedPercent: 86,
          lastVerificationLabel: '12 Jan 2026',
          fieldOfficerName: 'Rakesh Patel',
          verificationStatusLabel: 'Verified',
        };

  const coordinates = getFarmCoordinates(farmRecord) ?? getDemoCenter();
  const acres = parseAcres(farmRecord);
  const polygon = parseFarmPolygon(farmRecord, coordinates, acres);
  const verificationBadge = getFarmVerificationBadge(farmRecord);

  const areaLabel = getFarmAreaLabel(farmRecord);
  const resolvedArea = areaLabel === '—' ? '12.45 Acres' : areaLabel;

  return {
    farm,
    farmName: farm.name === `Farm ${farm.id}` ? 'Demo Farmer Farm' : farm.name,
    farmCode: farm.code === 'BG-FARM-000' ? 'BG-BHG-FARM-000001' : farm.code,
    statusLabel: titleCase(pickString(farmRecord, 'status') !== '-' ? pickString(farmRecord, 'status') : 'Active'),
    verificationLabel:
      verificationBadge === 'verified'
        ? 'Verified'
        : verificationBadge === 'pending'
          ? 'Pending'
          : 'Draft',
    projectName:
      pickString(farmRecord, 'project_name', 'service_name') !== '-'
        ? pickString(farmRecord, 'project_name', 'service_name')
        : 'Regenerative Agriculture',
    areaLabel: resolvedArea,
    locationLabel:
      getFarmLocationLabel(farmRecord) !== 'Location not set'
        ? getFarmLocationLabel(farmRecord)
        : 'Demo Village, Ahmedabad, Gujarat',
    surveyNumber:
      pickString(farmRecord, 'land_survey_number', 'survey_number') !== '-'
        ? pickString(farmRecord, 'land_survey_number', 'survey_number')
        : 'GJ-2026-1458',
    cropLabel: farm.cropLabel !== '—' ? farm.cropLabel : 'Wheat',
    soilLabel: farm.soilLabel !== '—' ? farm.soilLabel : 'Black Soil',
    irrigationLabel:
      pickString(farmRecord, 'irrigation_type') !== '-' ? titleCase(pickString(farmRecord, 'irrigation_type')) : 'Drip',
    mappedLabel: isFarmMapped(farmRecord) ? 'Yes' : 'No',
    coordinatesLabel: formatCoordinatePair(coordinates),
    enrollmentDate: pickString(farmRecord, 'enrollment_date', 'created_at') !== '-' ? pickString(farmRecord, 'enrollment_date', 'created_at') : '12 Jan 2026',
    carbonProgramLabel: 'Active',
    fieldOfficerName:
      pickNestedString(farmRecord, 'field_officer.name') !== '-'
        ? pickNestedString(farmRecord, 'field_officer.name')
        : 'Rakesh Patel',
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
