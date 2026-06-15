import { useCallback, useEffect, useState } from 'react';



import {

  getFarmerActivityLogs,

  getFarmerCarbonCalculations,

  getFarmerDashboard,

  getFarmerFarms,

  getFarmerProfile,

  getFarmerServices,

  getFarmerVerificationStatus,

} from '../api/farmerApi';

import { getApiErrorMessage } from '../api/authApi';

import { getAuthUser } from '../storage/authStorage';

import {

  buildActivitiesSummary,

  buildFarmNameMap,

  extractActivityLogs,

  extractVerificationAssignments,

  mapActivityRecord,

  type FarmerActivityViewModel,

} from '../utils/farmerActivityHelpers';

import { extractList, pickNestedString, pickString, type ApiRecord } from '../utils/apiHelpers';



export interface FarmerDashboardTask {
  id: string;
  title: string;
  subtitle: string;
  overdue?: boolean;
  type: 'soil' | 'plot';
  targetId?: number;
}

export interface FarmerDashboardVerificationSummary {

  lastVisitLabel: string;

  fieldOfficerName: string;

  statusLabel: string;

}



export interface FarmerDashboardViewModel {

  firstName: string;

  fullName: string;

  farmerCode: string;

  locationLabel: string;

  projectName: string;

  totalLandLabel: string;

  isVerified: boolean;

  totalFarmsCount: number;

  activitiesSubmittedCount: number;

  estimatedCarbonLabel: string;

  creditsEligibleLabel: string;

  recentActivities: FarmerActivityViewModel[];

  verificationSummary: FarmerDashboardVerificationSummary;

}



function parseNumber(value: unknown): number {

  const parsed = Number(value);



  return Number.isFinite(parsed) ? parsed : 0;

}



function firstNameFromName(name: string): string {

  const trimmed = name.trim();



  if (!trimmed) {

    return 'Farmer';

  }



  return trimmed.split(/\s+/)[0] ?? 'Farmer';

}



function formatFarmerCode(profile: ApiRecord): string {

  const code = pickString(profile, 'farmer_code');



  if (code !== '-') {

    return code.startsWith('BG-') ? code : `BG-${code}`;

  }



  const id = pickString(profile, 'id', 'farmer_id');



  if (id !== '-') {

    return `BG-F-${id.padStart(6, '0')}`;

  }



  return 'BG-F-000000';

}



function buildLocationLabel(profile: ApiRecord): string {

  const farmerProfile = (profile.farmer_profile ?? profile) as ApiRecord;

  const parts = [

    pickString(farmerProfile, 'village'),

    pickString(farmerProfile, 'taluka', 'taluka_name'),

    pickString(farmerProfile, 'district', 'district_name'),

  ].filter((part) => part && part !== '-');



  return parts.length > 0 ? parts.join(', ') : 'Location not set';

}



function buildProjectName(services: ApiRecord[], calculations: ApiRecord[]): string {

  const serviceName = services

    .map((item) => pickString(item, 'service_name', 'name'))

    .find((name) => name !== '-');



  if (serviceName) {

    return serviceName;

  }



  const calcService = calculations

    .map((item) => pickString(item, 'service_name'))

    .find((name) => name !== '-');



  return calcService ?? 'Regenerative Agriculture';

}



function buildTotalLandLabel(farms: ApiRecord[]): string {

  if (farms.length === 0) {

    return '—';

  }



  let total = 0;

  let unit = 'Acres';



  for (const farm of farms) {

    total += parseNumber(farm.land_area ?? farm.area_acres);

    const farmUnit = pickString(farm, 'land_area_unit', 'area_unit');



    if (farmUnit !== '-') {

      unit = farmUnit.charAt(0).toUpperCase() + farmUnit.slice(1);

    }

  }



  if (total <= 0) {

    return '—';

  }



  return `${total % 1 === 0 ? total.toFixed(0) : total.toFixed(1)} ${unit}`;

}



function sumCarbonCredits(calculations: ApiRecord[]): number {

  return calculations.reduce((total, item) => total + parseNumber(item.estimated_carbon_credit), 0);

}



function isFarmerVerified(dashboard: ApiRecord): boolean {

  const verification = (dashboard.verification_status ?? {}) as ApiRecord;

  const approved = parseNumber(verification.approved);

  const total = parseNumber(verification.total_assignments);



  if (total <= 0) {

    return approved > 0;

  }



  return approved > 0 && approved >= total;

}



export function useFarmerDashboardData() {

  const [data, setData] = useState<FarmerDashboardViewModel | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);



  const load = useCallback(async () => {

    setLoading(true);

    setError(null);



    try {

      const [

        user,

        dashboardData,

        profileData,

        carbonData,

        farmsData,

        activityData,

        servicesData,

        verificationData,

      ] = await Promise.all([

        getAuthUser(),

        getFarmerDashboard(),

        getFarmerProfile(),

        getFarmerCarbonCalculations(),

        getFarmerFarms(),

        getFarmerActivityLogs(),

        getFarmerServices(),

        getFarmerVerificationStatus(),

      ]);



      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;

      const profileRoot = (profileData.profile ?? profileData) as ApiRecord;

      const farmerProfile = (profileRoot.farmer_profile ?? profileRoot) as ApiRecord;

      const calculations = extractList(carbonData as ApiRecord, ['carbon_calculations']);

      const farms = extractList(farmsData as ApiRecord, ['farms']);

      const services = extractList(servicesData as ApiRecord, ['services', 'farmer_services']);

      const farmNameById = buildFarmNameMap(farms);

      const verificationAssignments = extractVerificationAssignments(verificationData as ApiRecord);



      const mappedActivities = extractActivityLogs(activityData as ApiRecord)

        .map((record) => mapActivityRecord(record, farmNameById))

        .filter((item): item is FarmerActivityViewModel => item !== null)

        .sort((left, right) => right.sortKey - left.sortKey);



      const activitySummary = buildActivitiesSummary(mappedActivities, verificationAssignments);



      const name =

        user?.name?.trim() ||

        (pickNestedString(profileRoot, 'farmer_profile.name') !== '-'

          ? pickNestedString(profileRoot, 'farmer_profile.name')

          : pickString(farmerProfile, 'name', 'farmer_name'));



      const totalCarbon = sumCarbonCredits(calculations);

      const totalFarms = parseNumber(dashboard.active_farms_count) || farms.length;



      setData({

        firstName: firstNameFromName(name),

        fullName: name !== '-' ? name : 'Farmer',

        farmerCode: formatFarmerCode(farmerProfile),

        locationLabel: buildLocationLabel(profileRoot),

        projectName: buildProjectName(services, calculations),

        totalLandLabel: buildTotalLandLabel(farms),

        isVerified: isFarmerVerified(dashboard),

        totalFarmsCount: totalFarms,

        activitiesSubmittedCount: mappedActivities.length,

        estimatedCarbonLabel: totalCarbon > 0 ? totalCarbon.toFixed(1) : '0.0',

        creditsEligibleLabel: totalCarbon > 0 ? Math.round(totalCarbon * 100).toLocaleString('en-IN') : '0',

        recentActivities: mappedActivities.slice(0, 3),

        verificationSummary: {

          lastVisitLabel: activitySummary.lastVerificationLabel ?? 'Not yet visited',

          fieldOfficerName: activitySummary.fieldOfficerName ?? 'Not assigned',

          statusLabel: activitySummary.verificationStatusLabel,

        },

      });

    } catch (err) {

      setError(getApiErrorMessage(err, 'Failed to load dashboard.'));

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void load();

  }, [load]);



  return { data, loading, error, reload: load };

}

