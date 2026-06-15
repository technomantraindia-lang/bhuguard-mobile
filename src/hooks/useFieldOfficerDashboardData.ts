import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFieldOfficerDashboard,
  getFieldOfficerFarmers,
  getFieldOfficerProfile,
  getMonitoringReports,
  getSoilSamples,
  getVisitAssignments,
} from '../api/fieldOfficerApi';
import { getAuthUser } from '../storage/authStorage';
import { extractList, pickNestedString, pickString, type ApiRecord } from '../utils/apiHelpers';

export type OfficerTaskStatus = 'pending' | 'in_progress' | 'waiting';

export interface OfficerDashboardTask {
  id: string;
  title: string;
  location: string;
  dueLabel: string;
  status: OfficerTaskStatus;
  statusLabel: string;
  assignmentId?: number;
}

export interface OfficerMapMarker {
  id: string;
  label: string;
  tone: 'primary' | 'alert' | 'warning';
  top: number;
  left: number;
}

export interface FieldOfficerDashboardViewModel {
  officerName: string;
  assignedFarmersCount: number;
  pendingVerificationsCount: number;
  urgentPendingCount: number;
  tasks: OfficerDashboardTask[];
  mapMarkers: OfficerMapMarker[];
}

const PENDING_STATUSES = new Set(['assigned', 'accepted', 'correction_requested']);
const IN_PROGRESS_STATUSES = new Set(['started', 'checked_in', 'verification_in_progress']);

function parseNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDueLabel(value: unknown): string {
  const raw = pickString(value as ApiRecord | undefined, 'visit_date', 'due_date');

  if (raw === '-') {
    return 'Scheduled';
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Tomorrow';
  }

  if (diffDays === -1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function mapAssignmentStatus(status: string): { status: OfficerTaskStatus; label: string } {
  const normalized = status.toLowerCase();

  if (IN_PROGRESS_STATUSES.has(normalized)) {
    return { status: 'in_progress', label: 'In Progress' };
  }

  if (normalized === 'submitted_to_admin') {
    return { status: 'waiting', label: 'Waiting' };
  }

  return { status: 'pending', label: 'Pending' };
}

function buildAssignmentTasks(assignments: ApiRecord[]): OfficerDashboardTask[] {
  return assignments.slice(0, 4).map((assignment) => {
    const status = pickString(assignment, 'assignment_status', 'status');
    const mapped = mapAssignmentStatus(status);
    const code = pickString(assignment, 'assignment_code', 'id');

    return {
      id: `assignment-${pickString(assignment, 'id')}`,
      title: `Plot Verification ${code}`,
      location: pickNestedString(assignment, 'farm.farm_name') !== '-'
        ? pickNestedString(assignment, 'farm.farm_name')
        : pickNestedString(assignment, 'farmer.name'),
      dueLabel: formatDueLabel(assignment),
      status: mapped.status,
      statusLabel: mapped.label,
      assignmentId: parseNumber(assignment.id) || undefined,
    };
  });
}

function buildSoilSampleTasks(samples: ApiRecord[]): OfficerDashboardTask[] {
  return samples.slice(0, 2).map((sample) => ({
    id: `soil-${pickString(sample, 'id')}`,
    title: `Soil Sampling ${pickString(sample, 'sample_code', 'id')}`,
    location: pickString(sample, 'lab_name', 'plot_id') !== '-'
      ? `Plot ${pickString(sample, 'plot_id')}`
      : 'Field collection',
    dueLabel: formatDueLabel({ visit_date: pickString(sample, 'sampling_date') }),
    status: pickString(sample, 'status').toLowerCase() === 'completed' ? 'waiting' : 'pending',
    statusLabel: pickString(sample, 'status').toLowerCase() === 'completed' ? 'Waiting' : 'Pending',
  }));
}

function buildFarmerOnboardingTasks(farmers: ApiRecord[]): OfficerDashboardTask[] {
  return farmers
    .filter((farmer) => {
      const status = pickString(farmer, 'onboarding_status').toLowerCase();

      return status !== 'completed' && status !== 'approved' && status !== '-';
    })
    .slice(0, 2)
    .map((farmer) => ({
      id: `farmer-${pickString(farmer, 'farmer_id', 'id')}`,
      title: `Farmer Onboarding: ${pickString(farmer, 'name')}`,
      location: [pickString(farmer, 'village'), pickString(farmer, 'district')].filter((part) => part !== '-').join(', ') || 'Field area',
      dueLabel: 'Tomorrow',
      status: 'in_progress',
      statusLabel: 'In Progress',
    }));
}

function buildMapMarkers(assignments: ApiRecord[]): OfficerMapMarker[] {
  const markers: OfficerMapMarker[] = assignments.slice(0, 3).map((assignment, index) => ({
    id: `marker-${pickString(assignment, 'id')}`,
    label: index === 2 ? '!' : String(index + 1),
    tone: index === 2 ? 'alert' : index === 1 ? 'warning' : 'primary',
    top: [18, 42, 28][index] ?? 30,
    left: [16, 52, 72][index] ?? 40,
  }));

  if (markers.length === 0) {
    return [
      { id: 'marker-1', label: '1', tone: 'primary', top: 24, left: 20 },
      { id: 'marker-2', label: '!', tone: 'alert', top: 38, left: 62 },
    ];
  }

  return markers;
}

function extractTotalCount(data: ApiRecord, list: ApiRecord[]): number {
  const directTotal = parseNumber(data.total);

  if (directTotal > 0) {
    return directTotal;
  }

  const pagination = data.pagination as ApiRecord | undefined;
  const paginationTotal = parseNumber(pagination?.total);

  if (paginationTotal > 0) {
    return paginationTotal;
  }

  const meta = data.meta as ApiRecord | undefined;
  const metaTotal = parseNumber(meta?.total ?? data.total);

  if (metaTotal > 0) {
    return metaTotal;
  }

  return list.length;
}

function countPendingAssignments(assignments: ApiRecord[]): number {
  return assignments.filter((assignment) => {
    const status = pickString(assignment, 'assignment_status', 'status').toLowerCase();

    return PENDING_STATUSES.has(status) || IN_PROGRESS_STATUSES.has(status);
  }).length;
}

function countUrgentPending(assignments: ApiRecord[]): number {
  return assignments.filter((assignment) => {
    const status = pickString(assignment, 'assignment_status', 'status').toLowerCase();
    const priority = pickString(assignment, 'priority').toLowerCase();

    return priority === 'high' || priority === 'urgent' || status === 'correction_requested';
  }).length;
}

async function loadOptional<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

export function useFieldOfficerDashboardData() {
  const [data, setData] = useState<FieldOfficerDashboardViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [user, dashboardData, assignmentsData, farmersData, profileData, soilData, monitoringData] =
        await Promise.all([
          getAuthUser(),
          loadOptional(() => getFieldOfficerDashboard(), { dashboard: {} }),
          loadOptional(() => getVisitAssignments(), {}),
          loadOptional(() => getFieldOfficerFarmers(), {}),
          loadOptional(() => getFieldOfficerProfile(), { user: {} }),
          loadOptional(() => getSoilSamples(), { soil_samples: [] }),
          loadOptional(() => getMonitoringReports(), {}),
        ]);

      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const profileUser = (profileData.user ?? profileData) as ApiRecord;
      const assignments = extractList(assignmentsData as ApiRecord, ['data', 'assignments']);
      const farmers = extractList(farmersData as ApiRecord, ['farmers', 'data']);
      const soilSamples = extractList(soilData as ApiRecord, ['soil_samples']);
      const monitoringReports = extractList(monitoringData as ApiRecord, ['monitoring_reports', 'reports']);

      const assignedFarmersCount =
        parseNumber(dashboard.assigned_farmers_count) || extractTotalCount(farmersData as ApiRecord, farmers);

      const pendingVerificationsCount =
        parseNumber(dashboard.pending_verifications_count) || countPendingAssignments(assignments);

      const urgentPendingCount =
        parseNumber(dashboard.urgent_pending_count) || countUrgentPending(assignments);

      const assignmentTasks = buildAssignmentTasks(assignments);
      const soilTasks = buildSoilSampleTasks(soilSamples);
      const onboardingTasks = buildFarmerOnboardingTasks(farmers);
      const monitoringTasks = monitoringReports.slice(0, 1).map((report) => ({
        id: `report-${pickString(report, 'id')}`,
        title: `Monitoring Report ${pickString(report, 'report_code', 'id')}`,
        location: pickString(report, 'farm_name', 'farmer_name') !== '-'
          ? pickString(report, 'farm_name', 'farmer_name')
          : 'Assigned farm',
        dueLabel: formatDueLabel(report),
        status: 'waiting' as const,
        statusLabel: 'Waiting',
      }));

      const tasks = [...assignmentTasks, ...onboardingTasks, ...soilTasks, ...monitoringTasks].slice(0, 4);

      setData({
        officerName:
          user?.name ??
          pickString(dashboard, 'officer_name') ??
          pickString(profileUser, 'name'),
        assignedFarmersCount,
        pendingVerificationsCount,
        urgentPendingCount,
        tasks,
        mapMarkers: buildMapMarkers(assignments),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load field officer dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
