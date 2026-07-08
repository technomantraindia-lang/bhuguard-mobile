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

  const assignedToday = visits.filter((visit) => visit.isToday).length;

  const pendingVerification = visits.filter((visit) => visit.isPending).length;

  const completed = visits.filter((visit) => visit.isCompleted).length;

  const highPriority = visits.filter((visit) => visit.isHighPriority).length;



  return {

    assignedToday,

    pendingVerification,

    completed,

    highPriority,

    totalVisits: visits.length,

    routeCompleted: completed,

    routePending: pendingVerification,

  };

}



function buildActivitiesFromAssignments(assignments: ApiRecord[] = []): OfficerDashboardActivity[] {

  const activityTitles: Record<string, string> = {

    completed: 'Visit Completed',

    approved: 'Visit Completed',

    started: 'Verification Started',

    checked_in: 'GPS Check-In Completed',

    verification_in_progress: 'Verification In Progress',

    accepted: 'Visit Accepted',

    assigned: 'Pending Visited',

  };



  return assignments.slice(0, 4).map((assignment) => {

    const status = pickString(assignment, 'assignment_status', 'status').toLowerCase();

    const name =

      pickNestedString(assignment, 'farmer.name') !== '-'

        ? pickNestedString(assignment, 'farmer.name')

        : pickNestedString(assignment, 'farm.farm_name') !== '-'

          ? pickNestedString(assignment, 'farm.farm_name')

          : pickNestedString(assignment, 'company.name');



    return {

      id: `activity-${pickString(assignment, 'id')}`,

      title: activityTitles[status] ?? 'Field Activity',

      subtitle: `${name !== '-' ? name : 'Assignment'} • ${formatTimeLabel(assignment)}`,

      tone: status === 'completed' || status === 'approved' ? 'success' : 'primary',

    } as OfficerDashboardActivity;

  });

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

        getVisitAssignments(),

        getFieldOfficerProfile().catch(() => ({ user: {} } as ApiRecord)),

      ]);



      const profileUser = (profileData.user ?? profileData) as ApiRecord;

      const assignments = extractList(assignmentsData, ['assignments', 'data']);

      const visits = assignments.map(mapAssignmentToVisit);

      const officerName = user?.name ?? pickString(profileUser, 'name') ?? 'Field Officer';



      setData({

        officerName,

        visits,

        summary: buildSummary(visits),

        recentActivities: buildActivitiesFromAssignments(assignments),

      });

    } catch (err) {

      setError(getApiErrorMessage(err, 'Failed to load assigned visits.'));

      setData(null);

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


