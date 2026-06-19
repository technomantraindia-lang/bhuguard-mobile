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

export type OfficerTaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'waiting';

export interface OfficerDashboardVisit {
  id: string;
  farmerName: string;
  farmName: string;
  location: string;
  timeLabel: string;
  status: OfficerTaskStatus;
  statusLabel: string;
  assignmentId?: number;
  /** @deprecated use farmerName */
  title?: string;
  /** @deprecated use timeLabel */
  dueLabel?: string;
}

export interface OfficerDashboardActivity {
  id: string;
  title: string;
  subtitle: string;
  tone: 'success' | 'primary' | 'neutral';
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
  officerCode: string;
  regionLabel: string;
  greeting: string;
  isActive: boolean;
  visitsTodayCount: number;
  assignedVisitsCount: number;
  todayTargetsCount: number;
  pendingReportsCount: number;
  monthDoneCount: number;
  assignedFarmersCount: number;
  pendingVerificationsCount: number;
  urgentPendingCount: number;
  pipeline: {
    pending: number;
    review: number;
    correction: number;
    approved: number;
  };
  coverageTotal: number;
  coverageMapped: number;
  monthlyRating: number;
  accuracyPercent: number;
  reportRateLabel: string;
  visits: OfficerDashboardVisit[];
  recentActivities: OfficerDashboardActivity[];
  mapMarkers: OfficerMapMarker[];
}

const PENDING_STATUSES = new Set(['assigned', 'accepted', 'correction_requested']);
const IN_PROGRESS_STATUSES = new Set(['started', 'checked_in', 'verification_in_progress']);

function parseNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
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

function formatTimeLabel(value: unknown): string {
  const raw = pickString(value as ApiRecord | undefined, 'visit_date', 'due_date', 'scheduled_at');

  if (raw === '-') {
    return 'Scheduled';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function isToday(value: unknown): boolean {
  const raw = pickString(value as ApiRecord | undefined, 'visit_date', 'due_date', 'scheduled_at');
  if (raw === '-') {
    return false;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function mapVisitStatus(status: string): { status: OfficerTaskStatus; label: string } {
  const normalized = status.toLowerCase();

  if (IN_PROGRESS_STATUSES.has(normalized)) {
    return { status: 'in_progress', label: 'In Progress' };
  }

  if (normalized === 'submitted_to_admin') {
    return { status: 'waiting', label: 'Review' };
  }

  if (normalized === 'approved') {
    return { status: 'scheduled', label: 'Completed' };
  }

  if (normalized === 'assigned' || normalized === 'accepted') {
    return { status: 'scheduled', label: 'Scheduled' };
  }

  return { status: 'pending', label: 'Pending' };
}

function buildVisits(assignments: ApiRecord[]): OfficerDashboardVisit[] {
  return assignments.slice(0, 6).map((assignment) => {
    const status = pickString(assignment, 'assignment_status', 'status');
    const mapped = mapVisitStatus(status);
    const farmerName = pickNestedString(assignment, 'farmer.name') !== '-'
      ? pickNestedString(assignment, 'farmer.name')
      : `Farmer ${pickString(assignment, 'farmer_id', 'id')}`;
    const farmName = pickNestedString(assignment, 'farm.farm_name') !== '-'
      ? pickNestedString(assignment, 'farm.farm_name')
      : 'Farm visit';
    const village = pickNestedString(assignment, 'farmer.village');
    const district = pickNestedString(assignment, 'farmer.district');
    const location = [village, district].filter((part) => part !== '-').join(', ') || farmName;

    return {
      id: `visit-${pickString(assignment, 'id')}`,
      farmerName,
      farmName,
      location: `${farmName} • ${location}`,
      timeLabel: formatTimeLabel(assignment),
      title: farmerName,
      dueLabel: formatDueLabel(assignment),
      status: mapped.status,
      statusLabel: mapped.label,
      assignmentId: parseNumber(assignment.id) || undefined,
    };
  });
}

function buildRecentActivities(assignments: ApiRecord[], reports: ApiRecord[]): OfficerDashboardActivity[] {
  const items: OfficerDashboardActivity[] = [];

  assignments
    .filter((assignment) => pickString(assignment, 'assignment_status', 'status').toLowerCase() === 'approved')
    .slice(0, 2)
    .forEach((assignment) => {
      items.push({
        id: `approved-${pickString(assignment, 'id')}`,
        title: 'Verification Completed',
        subtitle: `Farmer: ${pickNestedString(assignment, 'farmer.name')} • ${formatTimeLabel(assignment)}`,
        tone: 'success',
      });
    });

  reports.slice(0, 1).forEach((report) => {
    items.push({
      id: `report-${pickString(report, 'id')}`,
      title: 'Evidence Uploaded',
      subtitle: `${pickString(report, 'report_code', 'title') !== '-' ? pickString(report, 'report_code', 'title') : 'Field report'} • ${formatTimeLabel(report)}`,
      tone: 'primary',
    });
  });

  if (items.length === 0) {
    return [
      {
        id: 'default-1',
        title: 'Dashboard Synced',
        subtitle: 'Your field data is up to date.',
        tone: 'neutral',
      },
    ];
  }

  return items.slice(0, 3);
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
      { id: 'marker-2', label: '2', tone: 'warning', top: 38, left: 62 },
    ];
  }

  return markers;
}

function countMappedFarmers(farmers: ApiRecord[]): number {
  return farmers.filter((farmer) => {
    const status = pickString(farmer, 'boundary_status', 'onboarding_status').toLowerCase();
    return status === 'mapped' || status === 'approved' || status === 'completed';
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
      const [user, dashboardData, assignmentsData, farmersData, profileData, monitoringData] = await Promise.all([
        getAuthUser(),
        loadOptional(() => getFieldOfficerDashboard(), { dashboard: {} }),
        loadOptional(() => getVisitAssignments(), {}),
        loadOptional(() => getFieldOfficerFarmers(), {}),
        loadOptional(() => getFieldOfficerProfile(), { user: {} }),
        loadOptional(() => getMonitoringReports(), {}),
      ]);

      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const profileUser = (profileData.user ?? profileData) as ApiRecord;
      const fieldOfficer = (profileUser.field_officer ?? profileUser.fieldOfficer ?? {}) as ApiRecord;
      const assignmentStatus = (dashboard.assignment_status ?? {}) as ApiRecord;
      const assignments = extractList(assignmentsData as ApiRecord, ['assignments', 'data']);
      const farmers = extractList(farmersData as ApiRecord, ['farmers', 'data']);
      const monitoringReports = extractList(monitoringData as ApiRecord, ['monitoring_reports', 'reports']);

      const officerName =
        user?.name ?? pickString(dashboard, 'officer_name') ?? pickString(profileUser, 'name') ?? 'Field Officer';

      const officerCode = pickString(fieldOfficer, 'officer_code') !== '-'
        ? pickString(fieldOfficer, 'officer_code')
        : pickString(dashboard, 'officer_code') !== '-'
          ? pickString(dashboard, 'officer_code')
          : 'FO-00021';

      const district = pickString(fieldOfficer, 'district') !== '-' ? pickString(fieldOfficer, 'district') : 'Assigned Region';
      const taluka = pickString(fieldOfficer, 'taluka');
      const regionLabel = taluka !== '-' ? `${taluka}, ${district}` : district;

      const assignedFarmersCount =
        parseNumber(dashboard.assigned_farmers_count) || farmers.length;

      const pendingVerificationsCount =
        parseNumber(dashboard.pending_verifications_count) ||
        parseNumber(assignmentStatus.pending) ||
        assignments.filter((assignment) =>
          PENDING_STATUSES.has(pickString(assignment, 'assignment_status', 'status').toLowerCase()) ||
          IN_PROGRESS_STATUSES.has(pickString(assignment, 'assignment_status', 'status').toLowerCase()),
        ).length;

      const visitsTodayCount = assignments.filter((assignment) => isToday(assignment)).length;
      const assignedVisitsCount = parseNumber(assignmentStatus.total_assignments) || assignments.length;
      const todayTargetsCount = visitsTodayCount || Math.min(8, pendingVerificationsCount);
      const pendingReportsCount =
        parseNumber(assignmentStatus.submitted_to_admin) + parseNumber(assignmentStatus.correction_requested) ||
        monitoringReports.length;
      const monthDoneCount = parseNumber(assignmentStatus.approved);

      const pipeline = {
        pending: parseNumber(assignmentStatus.pending) || pendingVerificationsCount,
        review: parseNumber(assignmentStatus.submitted_to_admin),
        correction: parseNumber(assignmentStatus.correction_requested),
        approved: parseNumber(assignmentStatus.approved),
      };

      const coverageMapped = countMappedFarmers(farmers);
      const coverageTotal = assignedFarmersCount || farmers.length || coverageMapped;

      const approvedCount = pipeline.approved;
      const totalReports = approvedCount + pipeline.review + pipeline.pending;
      const reportRateLabel = totalReports > 0 ? `${approvedCount}/${totalReports}` : `${monthDoneCount}/0`;

      setData({
        officerName,
        officerCode,
        regionLabel,
        greeting: getGreeting(),
        isActive: true,
        visitsTodayCount: todayTargetsCount,
        assignedVisitsCount,
        todayTargetsCount,
        pendingReportsCount,
        monthDoneCount,
        assignedFarmersCount,
        pendingVerificationsCount,
        urgentPendingCount: parseNumber(dashboard.urgent_pending_count),
        pipeline,
        coverageTotal,
        coverageMapped,
        monthlyRating: 4.8,
        accuracyPercent: totalReports > 0 ? Math.round((approvedCount / Math.max(totalReports, 1)) * 100) : 97,
        reportRateLabel,
        visits: buildVisits(assignments),
        recentActivities: buildRecentActivities(assignments, monitoringReports),
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

// Backward compatibility for any imports of OfficerDashboardTask
export type OfficerDashboardTask = OfficerDashboardVisit;
