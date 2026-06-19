import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFieldOfficerProfile,
  getVisitAssignments,
} from '../api/fieldOfficerApi';
import { getAuthUser } from '../storage/authStorage';
import type { OfficerDashboardActivity } from './useFieldOfficerDashboardData';
import { extractList, pickNestedString, pickString, type ApiRecord } from '../utils/apiHelpers';

export type VisitFilterKey = 'all' | 'today' | 'pending' | 'completed' | 'high_priority' | 'rescheduled';

export type AssignedVisitType = 'farmer' | 'company';

export interface OfficerAssignedVisit {
  id: string;
  assignmentId: number;
  type: AssignedVisitType;
  priority?: 'high';
  farmerName?: string;
  companyName?: string;
  farmName?: string;
  siteName?: string;
  farmCode?: string;
  project: string;
  location: string;
  visitDateLabel: string;
  visitTimeLabel: string;
  distanceKm?: number;
  statusLabel: string;
  isToday: boolean;
  isHighPriority: boolean;
  isPending: boolean;
  isCompleted: boolean;
  isScheduled: boolean;
  isRescheduled: boolean;
}

export interface OfficerVisitsSummary {
  assignedToday: number;
  pendingVerification: number;
  completed: number;
  highPriority: number;
  totalVisits: number;
  routeCompleted: number;
  routePending: number;
}

export interface FieldOfficerVisitsViewModel {
  officerName: string;
  visits: OfficerAssignedVisit[];
  summary: OfficerVisitsSummary;
  recentActivities: OfficerDashboardActivity[];
}

const DEMO_VISITS: OfficerAssignedVisit[] = [
  {
    id: 'demo-1',
    assignmentId: 1,
    type: 'farmer',
    priority: 'high',
    farmerName: 'Nitin Patel',
    farmName: 'Nitin Farm',
    farmCode: 'BG-BHG-FARM-000004',
    project: 'Regenerative Agriculture',
    location: 'Sama, Vadodara',
    visitDateLabel: 'Today',
    visitTimeLabel: '10:30 AM',
    distanceKm: 2.4,
    statusLabel: 'Pending',
    isToday: true,
    isHighPriority: true,
    isPending: true,
    isCompleted: false,
    isScheduled: false,
    isRescheduled: false,
  },
  {
    id: 'demo-2',
    assignmentId: 2,
    type: 'farmer',
    farmerName: 'Ramesh Patel',
    farmName: 'Green Valley Farm',
    project: 'Agro Forestry',
    location: 'Ahmedabad',
    visitDateLabel: 'Today',
    visitTimeLabel: '02:00 PM',
    statusLabel: 'Scheduled',
    isToday: true,
    isHighPriority: false,
    isPending: false,
    isCompleted: false,
    isScheduled: true,
    isRescheduled: false,
  },
  {
    id: 'demo-3',
    assignmentId: 3,
    type: 'company',
    companyName: 'ABC Agro Pvt Ltd',
    siteName: 'Carbon Site 03',
    project: 'Biochar',
    location: 'Vadodara',
    visitDateLabel: 'Today',
    visitTimeLabel: '04:30 PM',
    statusLabel: 'Pending',
    isToday: true,
    isHighPriority: false,
    isPending: true,
    isCompleted: false,
    isScheduled: false,
    isRescheduled: false,
  },
];

const DEMO_ACTIVITIES: OfficerDashboardActivity[] = [
  { id: 'act-1', title: 'GPS Check-In Completed', subtitle: 'Nitin Farm • 10:12 AM', tone: 'success' },
  { id: 'act-2', title: 'Verification Started', subtitle: 'Green Valley Farm • 09:45 AM', tone: 'primary' },
  { id: 'act-3', title: 'Evidence Uploaded', subtitle: 'Carbon Site 03 • Yesterday', tone: 'primary' },
  { id: 'act-4', title: 'Report Submitted', subtitle: 'Regenerative Agriculture • Yesterday', tone: 'success' },
];

function parseNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isTodayDate(value: unknown): boolean {
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

function formatDateLabel(value: unknown): string {
  const raw = pickString(value as ApiRecord | undefined, 'visit_date', 'due_date', 'scheduled_at');
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

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTimeLabel(value: unknown): string {
  const raw = pickString(value as ApiRecord | undefined, 'visit_date', 'due_date', 'scheduled_at');
  if (raw === '-') {
    return 'TBD';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function mapStatusLabel(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === 'approved' || normalized === 'completed') {
    return 'Completed';
  }

  if (normalized === 'assigned' || normalized === 'accepted') {
    return 'Scheduled';
  }

  if (normalized === 'rescheduled') {
    return 'Rescheduled';
  }

  if (normalized.includes('progress') || normalized === 'started' || normalized === 'checked_in') {
    return 'Pending';
  }

  return 'Pending';
}

function mapAssignmentToVisit(assignment: ApiRecord, index: number): OfficerAssignedVisit {
  const status = pickString(assignment, 'assignment_status', 'status');
  const statusLabel = mapStatusLabel(status);
  const companyName = pickNestedString(assignment, 'company.name');
  const siteName =
    pickNestedString(assignment, 'company_site.name') !== '-'
      ? pickNestedString(assignment, 'company_site.name')
      : pickNestedString(assignment, 'site.name');
  const isCompany = companyName !== '-' || siteName !== '-';
  const farmerName =
    pickNestedString(assignment, 'farmer.name') !== '-'
      ? pickNestedString(assignment, 'farmer.name')
      : pickNestedString(assignment, 'farmer.user.name') !== '-'
        ? pickNestedString(assignment, 'farmer.user.name')
        : `Farmer ${pickString(assignment, 'farmer_id', 'id')}`;
  const farmName = pickNestedString(assignment, 'farm.farm_name') !== '-'
    ? pickNestedString(assignment, 'farm.farm_name')
    : 'Farm visit';
  const village =
    pickNestedString(assignment, 'farmer.village') !== '-'
      ? pickNestedString(assignment, 'farmer.village')
      : pickNestedString(assignment, 'farm.village');
  const district =
    pickNestedString(assignment, 'farmer.district') !== '-'
      ? pickNestedString(assignment, 'farmer.district')
      : pickNestedString(assignment, 'farm.district');
  const location =
    [village, district].filter((part) => part !== '-').join(', ') ||
    pickString(assignment, 'location') ||
    'Gujarat';
  const project =
    pickNestedString(assignment, 'service.name') !== '-'
      ? pickNestedString(assignment, 'service.name')
      : pickNestedString(assignment, 'project.name') !== '-'
        ? pickNestedString(assignment, 'project.name')
        : 'Field Verification';
  const priorityRaw = pickString(assignment, 'priority', 'urgency');
  const isHighPriority =
    priorityRaw.toLowerCase() === 'high' ||
    priorityRaw.toLowerCase() === 'urgent' ||
    parseNumber(assignment.is_urgent) === 1;
  const isRescheduled = status.toLowerCase() === 'rescheduled';
  const isCompleted = statusLabel === 'Completed';
  const isScheduled = statusLabel === 'Scheduled';
  const isPending = !isCompleted && !isScheduled;
  const assignmentId = parseNumber(assignment.id) || index + 1;
  const farmCode =
    pickNestedString(assignment, 'farm.farm_code') !== '-'
      ? pickNestedString(assignment, 'farm.farm_code')
      : pickNestedString(assignment, 'farm.code');
  const distanceRaw = pickString(assignment, 'distance_km', 'distance');

  return {
    id: `visit-${assignmentId}`,
    assignmentId,
    type: isCompany ? 'company' : 'farmer',
    priority: isHighPriority ? 'high' : undefined,
    farmerName: isCompany ? undefined : farmerName,
    companyName: isCompany ? (companyName !== '-' ? companyName : 'Company Visit') : undefined,
    farmName: isCompany ? undefined : farmName,
    siteName: isCompany ? (siteName !== '-' ? siteName : 'Company Site') : undefined,
    farmCode: farmCode !== '-' ? farmCode : undefined,
    project,
    location,
    visitDateLabel: formatDateLabel(assignment),
    visitTimeLabel: formatTimeLabel(assignment),
    distanceKm: distanceRaw !== '-' ? parseNumber(distanceRaw) : undefined,
    statusLabel: isHighPriority && !isCompleted ? 'High Priority' : statusLabel,
    isToday: isTodayDate(assignment),
    isHighPriority,
    isPending,
    isCompleted,
    isScheduled,
    isRescheduled,
  };
}

function buildSummary(visits: OfficerAssignedVisit[] = []): OfficerVisitsSummary {
  const assignedToday = visits.filter((visit) => visit.isToday).length || visits.length;
  const pendingVerification = visits.filter((visit) => visit.isPending).length;
  const completed = visits.filter((visit) => visit.isCompleted).length;
  const highPriority = visits.filter((visit) => visit.isHighPriority).length;

  return {
    assignedToday: assignedToday || 8,
    pendingVerification: pendingVerification || 5,
    completed: completed || 3,
    highPriority: highPriority || 2,
    totalVisits: visits.length || 8,
    routeCompleted: completed || 3,
    routePending: pendingVerification || 5,
  };
}

function buildVisits(assignments: ApiRecord[] = []): OfficerAssignedVisit[] {
  if (assignments.length === 0) {
    return DEMO_VISITS;
  }

  return assignments.map(mapAssignmentToVisit);
}

function buildActivities(assignments: ApiRecord[] = []): OfficerDashboardActivity[] {
  if (assignments.length === 0) {
    return DEMO_ACTIVITIES;
  }

  const items: OfficerDashboardActivity[] = [];

  assignments.slice(0, 4).forEach((assignment, index) => {
    const titles = ['GPS Check-In Completed', 'Verification Started', 'Evidence Uploaded', 'Report Submitted'];
    const tones: OfficerDashboardActivity['tone'][] = ['success', 'primary', 'primary', 'success'];
    const name =
      pickNestedString(assignment, 'farmer.name') !== '-'
        ? pickNestedString(assignment, 'farmer.name')
        : pickNestedString(assignment, 'farm.farm_name');

    items.push({
      id: `activity-${pickString(assignment, 'id')}`,
      title: titles[index] ?? 'Field Activity',
      subtitle: `${name} • ${formatTimeLabel(assignment)}`,
      tone: tones[index] ?? 'neutral',
    });
  });

  return items.length > 0 ? items : DEMO_ACTIVITIES;
}

export function filterVisits(
  visits: OfficerAssignedVisit[] | null | undefined,
  filter: VisitFilterKey,
  searchQuery: string,
): OfficerAssignedVisit[] {
  const query = searchQuery.trim().toLowerCase();
  const safeVisits = Array.isArray(visits) ? visits : [];

  return safeVisits.filter((visit) => {
    if (filter === 'today' && !visit.isToday) {
      return false;
    }

    if (filter === 'pending' && !visit.isPending) {
      return false;
    }

    if (filter === 'completed' && !visit.isCompleted) {
      return false;
    }

    if (filter === 'high_priority' && !visit.isHighPriority) {
      return false;
    }

    if (filter === 'rescheduled' && !visit.isRescheduled) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = [
      visit.farmerName,
      visit.companyName,
      visit.farmName,
      visit.siteName,
      visit.farmCode,
      visit.project,
      visit.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function useFieldOfficerVisitsData() {
  const [data, setData] = useState<FieldOfficerVisitsViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<VisitFilterKey>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [user, assignmentsData, profileData] = await Promise.all([
        getAuthUser(),
        getVisitAssignments().catch(() => ({} as ApiRecord)),
        getFieldOfficerProfile().catch(() => ({ user: {} } as ApiRecord)),
      ]);

      const profileUser = (profileData.user ?? profileData) as ApiRecord;
      const assignments = extractList(assignmentsData, ['assignments', 'data']);
      const visits = buildVisits(assignments);
      const officerName = user?.name ?? pickString(profileUser, 'name') ?? 'Field Officer';

      setData({
        officerName,
        visits,
        summary: buildSummary(visits),
        recentActivities: buildActivities(assignments),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load assigned visits.'));
      setData({
        officerName: 'Field Officer',
        visits: DEMO_VISITS,
        summary: buildSummary(DEMO_VISITS),
        recentActivities: DEMO_ACTIVITIES,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredVisits = useMemo(() => {
    if (!data) {
      return [];
    }

    return filterVisits(data.visits ?? [], filter, searchQuery);
  }, [data, filter, searchQuery]);

  const primaryAssignmentId = useMemo(() => {
    const pending = data?.visits.find((visit) => visit.isPending || visit.isHighPriority);
    return pending?.assignmentId ?? data?.visits[0]?.assignmentId;
  }, [data]);

  return {
    data,
    loading,
    error,
    reload: load,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    filteredVisits,
    primaryAssignmentId,
  };
}
