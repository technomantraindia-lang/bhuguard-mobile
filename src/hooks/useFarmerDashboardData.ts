import { useCallback, useEffect, useState } from 'react';

import {
  getFarmerFarmActivities,
  getFarmerDashboard,
  getFarmerEvidence,
  getFarmerFarms,
  getFarmerProfile,
  getFarmerServices,
} from '../api/farmerApi';
import { getApiErrorMessage } from '../api/authApi';
import { useTranslation } from '../i18n/I18nContext';
import { getAuthUser } from '../storage/authStorage';
import { formatLocalizedDate } from '../utils/localizedDate';
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
import { formatHectares, sumFarmAreasHectares } from '../utils/farmAreaUnits';
import { mapFarmRecord } from '../utils/farmMapHelpers';
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
    hectaresLabel: string;
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
  biocharNextUpdateLabel: string;
  biocharDaysRemainingLabel: string;
  biocharCycleStatusLabel: string;
  biocharCycleStatusKey: string;
  biocharCycleTone: 'default' | 'warning' | 'danger' | 'success' | 'draft';
  biocharCycleLoading: boolean;
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

export function useFarmerDashboardData() {
  const { language } = useTranslation();
  const [data, setData] = useState<FarmerDashboardViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const user = await getAuthUser();

      const [
        dashboardData,
        profileData,
        farmsData,
        farmActivityData,
        servicesData,
        evidenceData,
      ] = await Promise.all([
        loadDashboardSection(() => getFarmerDashboard(), { dashboard: {} }),
        loadDashboardSection(() => getFarmerProfile(), { profile: {} }),
        loadDashboardSection(() => getFarmerFarms(), { farms: [] }),
        loadDashboardSection(() => getFarmerFarmActivities('submitted'), { farm_activities: [] }),
        loadDashboardSection(() => getFarmerServices(), { services: [] }),
        loadDashboardSection(() => getFarmerEvidence(), { evidence: [] }),
      ]);

      const profileRoot = (profileData.profile ?? profileData) as ApiRecord;
      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const farmerProfile = (profileRoot.farmer_profile ?? profileRoot) as ApiRecord;
      const farms = extractList(farmsData as ApiRecord, ['farms']);
      const farmNameById = buildFarmNameMap(farms);
      const evidenceItems = extractList(evidenceData as ApiRecord, ['evidence', 'evidence_uploads']);
      const updateCycle = (dashboard.biochar_update_cycle ?? dashboard.farm_update_cycle ?? {}) as ApiRecord;
      const biocharBlock = (dashboard.biochar ?? {}) as ApiRecord;
      const walletBlock = (dashboard.wallet ?? biocharBlock.wallet ?? {}) as ApiRecord;
      const cycleStatus = String(
        updateCycle.status ?? updateCycle.farm_update_status ?? 'not_scheduled',
      ).toLowerCase();
      const daysRemaining = updateCycle.days_remaining;
      const nextDueDate = pickString(updateCycle, 'next_due_date', 'next_farm_update_date');
      const cycleTone: FarmerDashboardViewModel['biocharCycleTone'] =
        cycleStatus === 'overdue'
          ? 'danger'
          : cycleStatus === 'due_soon'
            ? 'warning'
            : cycleStatus === 'draft'
              ? 'draft'
              : cycleStatus === 'submitted' || cycleStatus === 'updated'
                ? 'success'
                : 'default';

      const normalizedStatusKey =
        cycleStatus === 'updated' || cycleStatus === 'due_today'
          ? cycleStatus === 'due_today'
            ? 'due_soon'
            : 'submitted'
          : cycleStatus;

      const statusLabelMap: Record<string, string> = {
        not_scheduled: 'Not Scheduled',
        not_started: 'Not Started',
        draft: 'Draft',
        submitted: 'Submitted',
        due_soon: 'Due Soon',
        overdue: 'Overdue',
      };

      const cycleStatusLabel =
        statusLabelMap[normalizedStatusKey] ??
        String(updateCycle.status_label ?? updateCycle.farm_update_status_label ?? 'Not Scheduled');

      let nextUpdateLabel = 'Not Scheduled';
      if (normalizedStatusKey === 'not_scheduled') {
        nextUpdateLabel = 'Not Scheduled';
      } else if (nextDueDate && nextDueDate !== '-') {
        nextUpdateLabel = formatLocalizedDate(nextDueDate, language);
      } else if (daysRemaining != null && daysRemaining !== undefined && daysRemaining !== '') {
        nextUpdateLabel = `${daysRemaining} days`;
      }

      const farmActivityRecords = extractList(farmActivityData as ApiRecord, ['farm_activities', 'farmActivities']);
      const mappedActivities = farmActivityRecords
        .map((record) => ({
          id: Number(record.id),
          title: 'Farm Activity',
          activityId: String(record.activity_code ?? record.id ?? ''),
          farmName: String(record.farm_code ?? record.farm_id ?? ''),
          dateLabel: formatLocalizedDate(String(record.activity_date ?? record.submitted_at ?? ''), language),
          statusLabel: String(record.status ?? 'submitted'),
          emoji: '🌾',
          sortKey: new Date(String(record.submitted_at ?? record.activity_date ?? 0)).getTime() || 0,
          status: String(record.status ?? 'submitted'),
        }))
        .filter((item) => item.id > 0)
        .sort((left, right) => right.sortKey - left.sortKey) as FarmerActivityViewModel[];

      const activitySummary = buildActivitiesSummary(mappedActivities, []);
      const farmViewModels = farms.map((farm) => mapFarmRecord(farm as ApiRecord));
      const totalHectares = sumFarmAreasHectares(farmViewModels);
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
        landInfo: totalHectares > 0
          ? {
              hectaresLabel: formatHectares(totalHectares, 2),
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
        biocharServiceStatusLabel: String(biocharBlock.service_status_label ?? 'Biochar'),
        biocharNextUpdateLabel: nextUpdateLabel,
        biocharDaysRemainingLabel:
          daysRemaining === null || daysRemaining === undefined || daysRemaining === ''
            ? nextUpdateLabel
            : `${daysRemaining} days`,
        biocharCycleStatusLabel: cycleStatusLabel,
        biocharCycleStatusKey: normalizedStatusKey,
        biocharCycleTone: cycleTone,
        biocharCycleLoading: false,
        walletAmountLabel: `₹${walletPending.toLocaleString('en-IN')}`,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { data, loading, refreshing, error, reload, refresh };
}
