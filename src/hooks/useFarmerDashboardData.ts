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
  countMappedFarms,
  extractActivityLogs,
  extractFarmerLocation,
  extractVerificationAssignments,
  formatFarmerCode,
  mapActivityRecord,
  type FarmerActivityViewModel,
} from '../utils/farmerActivityHelpers';
import { sumFarmLandTotals, formatLandAmount } from '../utils/farmerLandHelpers';
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
  mobile: string;
  location: {
    village: string;
    taluka: string;
    district: string;
    pincode: string;
  };
  projectName: string;
  landInfo: {
    acresLabel: string;
    hectaresLabel: string;
    bighaLabel: string;
  } | null;
  isVerified: boolean;
  verificationStatusLabel: string;
  totalFarmsCount: number;
  mappedFarmsCount: number;
  activitiesSubmittedCount: number;
  pendingActivitiesCount: number;
  approvedActivitiesCount: number;
  lastVerificationDate: string | null;
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

function formatMobile(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91 ${digits}`;
  }

  return value;
}

function normalizeProjectName(name: string): string {
  if (/biochar/i.test(name)) {
    return 'Biochar';
  }

  if (/agro.?forest/i.test(name)) {
    return 'Agroforestry';
  }

  if (/regenerative/i.test(name)) {
    return 'Regenerative Agriculture';
  }

  return name;
}

function buildProjectName(services: ApiRecord[], calculations: ApiRecord[]): string {
  const serviceName = services
    .map((item) => pickString(item, 'service_name', 'name'))
    .find((name) => name !== '-');

  if (serviceName) {
    return normalizeProjectName(serviceName);
  }

  const calcService = calculations
    .map((item) => pickString(item, 'service_name'))
    .find((name) => name !== '-');

  return calcService ? normalizeProjectName(calcService) : 'Regenerative Agriculture';
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

function formatVerificationDate(value: unknown): string | null {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return null;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
      const location = extractFarmerLocation(profileRoot);

      const mappedActivities = extractActivityLogs(activityData as ApiRecord)
        .map((record) => mapActivityRecord(record, farmNameById))
        .filter((item): item is FarmerActivityViewModel => item !== null)
        .sort((left, right) => right.sortKey - left.sortKey);

      const activitySummary = buildActivitiesSummary(mappedActivities, verificationAssignments);
      const landTotals = sumFarmLandTotals(farms);

      const name =
        user?.name?.trim() ||
        (pickNestedString(profileRoot, 'farmer_profile.name') !== '-'
          ? pickNestedString(profileRoot, 'farmer_profile.name')
          : pickString(farmerProfile, 'name', 'farmer_name'));

      const mobile =
        user?.mobile?.trim() ||
        pickString(profileRoot, 'mobile') ||
        pickNestedString(profileRoot, 'farmer_profile.mobile');

      const totalCarbon = sumCarbonCredits(calculations);
      const totalFarms = parseNumber(dashboard.active_farms_count) || farms.length;
      const mappedFarms = parseNumber(dashboard.mapped_farms_count) || countMappedFarms(farms);
      const pendingActivities =
        parseNumber(dashboard.pending_activities_count) ||
        mappedActivities.filter((item) => item.status !== 'approved' && item.status !== 'draft').length;
      const approvedActivities =
        parseNumber(dashboard.approved_activities_count) ||
        mappedActivities.filter((item) => item.status === 'approved').length;
      const lastVerificationDate =
        formatVerificationDate(dashboard.last_verification_date) ?? activitySummary.lastVerificationLabel;

      setData({
        firstName: firstNameFromName(name),
        fullName: name !== '-' ? name : 'Farmer',
        farmerCode: formatFarmerCode(farmerProfile),
        mobile: mobile && mobile !== '-' ? formatMobile(mobile) : '',
        location: {
          village: location.village !== '-' ? location.village : '',
          taluka: location.taluka !== '-' ? location.taluka : '',
          district: location.district !== '-' ? location.district : '',
          pincode: location.pincode !== '-' ? location.pincode : '',
        },
        projectName: buildProjectName(services, calculations),
        landInfo: landTotals
          ? {
              acresLabel: formatLandAmount(landTotals.acres, 'Acres'),
              hectaresLabel: formatLandAmount(landTotals.hectares, 'Hectares'),
              bighaLabel: formatLandAmount(landTotals.bigha, 'Bigha'),
            }
          : null,
        isVerified: isFarmerVerified(dashboard),
        verificationStatusLabel: activitySummary.verificationStatusLabel,
        totalFarmsCount: totalFarms,
        mappedFarmsCount: mappedFarms,
        activitiesSubmittedCount: mappedActivities.length,
        pendingActivitiesCount: pendingActivities,
        approvedActivitiesCount: approvedActivities,
        lastVerificationDate,
        estimatedCarbonLabel: totalCarbon > 0 ? totalCarbon.toFixed(1) : '0.0',
        creditsEligibleLabel: totalCarbon > 0 ? Math.round(totalCarbon * 100).toLocaleString('en-IN') : '0',
        recentActivities: mappedActivities.slice(0, 3),
        verificationSummary: {
          lastVisitLabel: lastVerificationDate ?? 'Not yet visited',
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
