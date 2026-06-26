import { useCallback, useEffect, useState } from 'react';

import {
  getFarmerActivityLogs,
  getFarmerDashboard,
  getFarmerEvidence,
  getFarmerFarms,
  getFarmerProfile,
  getFarmerServices,
} from '../api/farmerApi';
import { getApiErrorMessage } from '../api/authApi';
import { getAuthUser } from '../storage/authStorage';
import {
  buildActivitiesSummary,
  buildFarmNameMap,
  countMappedFarms,
  extractActivityLogs,
  extractFarmerLocation,
  formatFarmerCode,
  mapActivityRecord,
  type FarmerActivityViewModel,
} from '../utils/farmerActivityHelpers';
import { sumFarmLandTotals, formatLandAmount } from '../utils/farmerLandHelpers';
import { extractList, pickNestedString, pickString, type ApiRecord } from '../utils/apiHelpers';
import { resolveMediaUrl } from '../utils/mediaUrl';

export interface FarmerDashboardVerificationSummary {
  lastVisitLabel: string;
  fieldOfficerName: string;
  statusLabel: string;
}

export interface FarmerDashboardViewModel {
  firstName: string;
  fullName: string;
  photoUrl: string | null;
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
  activeServicesCount: number;
  weeklyUpdatesPendingCount: number;
  evidenceUploadedCount: number;
  reportsAvailableCount: number;
  biocharServiceStatusLabel: string;
  biocharDaysRemainingLabel: string;
  biocharCycleStatusLabel: string;
  biocharCycleTone: 'default' | 'warning' | 'danger';
  walletAmountLabel: string;
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

async function loadDashboardSection<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
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
      const user = await getAuthUser();

      const [
        dashboardData,
        profileData,
        farmsData,
        activityData,
        servicesData,
        evidenceData,
      ] = await Promise.all([
        loadDashboardSection(() => getFarmerDashboard(), { dashboard: {} }),
        loadDashboardSection(() => getFarmerProfile(), { profile: {} }),
        loadDashboardSection(() => getFarmerFarms(), { farms: [] }),
        loadDashboardSection(() => getFarmerActivityLogs(true), { activity_logs: [] }),
        loadDashboardSection(() => getFarmerServices(), { services: [] }),
        loadDashboardSection(() => getFarmerEvidence(), { evidence: [] }),
      ]);

      const profileRoot = (profileData.profile ?? profileData) as ApiRecord;
      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const farmerProfile = (profileRoot.farmer_profile ?? profileRoot) as ApiRecord;
      const farms = extractList(farmsData as ApiRecord, ['farms']);
      const farmNameById = buildFarmNameMap(farms);
      const evidenceItems = extractList(evidenceData as ApiRecord, ['evidence', 'evidence_uploads']);
      const biocharBlock = (dashboard.biochar ?? {}) as ApiRecord;
      const updateCycle = (dashboard.biochar_update_cycle ?? biocharBlock.update_cycle ?? {}) as ApiRecord;
      const walletBlock = (dashboard.wallet ?? biocharBlock.wallet ?? {}) as ApiRecord;
      const cycleStatus = String(updateCycle.cycle_status ?? 'not_started');
      const daysRemaining = updateCycle.days_remaining;
      const cycleTone: 'default' | 'warning' | 'danger' =
        cycleStatus === 'overdue' ? 'danger' : cycleStatus === 'due_today' || cycleStatus === 'due_soon' ? 'warning' : 'default';

      const mappedActivities = extractActivityLogs(activityData as ApiRecord)
        .map((record) => mapActivityRecord(record, farmNameById))
        .filter((item): item is FarmerActivityViewModel => item !== null)
        .sort((left, right) => right.sortKey - left.sortKey);

      const activitySummary = buildActivitiesSummary(mappedActivities, []);
      const landTotals = sumFarmLandTotals(farms);
      const location = extractFarmerLocation(profileRoot);

      const name =
        user?.name?.trim() ||
        (pickNestedString(profileRoot, 'farmer_profile.name') !== '-'
          ? pickNestedString(profileRoot, 'farmer_profile.name')
          : pickString(farmerProfile, 'name', 'farmer_name'));

      const mobile =
        user?.mobile?.trim() ||
        pickString(profileRoot, 'mobile') ||
        pickNestedString(profileRoot, 'farmer_profile.mobile');

      const totalFarms = parseNumber(dashboard.active_farms_count) || farms.length;
      const mappedFarms = parseNumber(dashboard.mapped_farms_count) || countMappedFarms(farms);
      const evidenceCount =
        parseNumber(dashboard.evidence_uploaded_count) ||
        parseNumber(biocharBlock.evidence_uploaded_count) ||
        evidenceItems.length;
      const walletPending = Number(walletBlock.pending_amount ?? 0);

      const photoUrl =
        resolveMediaUrl(pickString(farmerProfile, 'photo_url')) ??
        resolveMediaUrl(pickString(profileRoot, 'photo_url'));

      setData({
        firstName: firstNameFromName(name),
        fullName: name !== '-' ? name : 'Farmer',
        photoUrl,
        farmerCode: formatFarmerCode(farmerProfile),
        mobile: mobile && mobile !== '-' ? formatMobile(mobile) : '',
        location: {
          village: location.village !== '-' ? location.village : '',
          taluka: location.taluka !== '-' ? location.taluka : '',
          district: location.district !== '-' ? location.district : '',
          pincode: location.pincode !== '-' ? location.pincode : '',
        },
        projectName: 'Biochar',
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
        pendingActivitiesCount: 0,
        approvedActivitiesCount: mappedActivities.filter((item) => item.status === 'approved').length,
        lastVerificationDate: null,
        estimatedCarbonLabel: '0.0',
        creditsEligibleLabel: '0',
        recentActivities: mappedActivities.slice(0, 3),
        verificationSummary: {
          lastVisitLabel: 'Biochar program',
          fieldOfficerName: activitySummary.fieldOfficerName ?? 'Assigned officer',
          statusLabel: String(biocharBlock.service_status_label ?? 'Open'),
        },
        activeServicesCount: 1,
        weeklyUpdatesPendingCount: 0,
        evidenceUploadedCount: evidenceCount,
        reportsAvailableCount: 0,
        biocharServiceStatusLabel: String(biocharBlock.service_status_label ?? 'Open'),
        biocharDaysRemainingLabel:
          daysRemaining === null || daysRemaining === undefined ? '—' : `${daysRemaining} days`,
        biocharCycleStatusLabel: String(updateCycle.cycle_status_label ?? 'Not Started'),
        biocharCycleTone: cycleTone,
        walletAmountLabel: `₹${walletPending.toLocaleString('en-IN')}`,
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
