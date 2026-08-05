import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { getFieldOfficerDashboard, getFieldOfficerProfile } from '../api/fieldOfficerApi';
import { getAuthUser } from '../storage/authStorage';
import { isNetworkError, NETWORK_ERROR_MESSAGE } from '../utils/apiError';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { resolveMediaUrl } from '../utils/mediaUrl';

export interface FieldOfficerAssignedTaluka {
  id: number;
  name: string;
}

export interface FieldOfficerGovernmentIdInfo {
  type: string | null;
  label: string | null;
  lastFour: string | null;
  verifiedByBhuguard: boolean;
  available: boolean;
  viewUrl: string | null;
}

export interface FieldOfficerAppointmentLetterInfo {
  available: boolean;
  downloadUrl: string | null;
}

export interface FieldOfficerPerformanceStats {
  visitsCompleted: number;
  accuracyPercent: number;
  totalAssignments: number;
  pending: number;
  submittedToAdmin: number;
  approved: number;
  correctionRequested: number;
  rejected: number;
}

export interface FieldOfficerProfileViewModel {
  officerName: string;
  officerCode: string;
  roleLabel: string;
  regionLabel: string;
  statusLabel: string;
  isActive: boolean;
  mobile: string;
  email: string;
  state: string;
  district: string;
  assignedArea: string;
  photoUrl: string | null;
  assignedTalukas: FieldOfficerAssignedTaluka[];
  governmentId: FieldOfficerGovernmentIdInfo;
  appointmentLetter: FieldOfficerAppointmentLetterInfo;
  performance: FieldOfficerPerformanceStats;
}

function parseNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

async function loadOptional<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch {
    return fallback;
  }
}

function buildRegionLabel(fieldOfficer: ApiRecord): string {
  const district = pickString(fieldOfficer, 'district');
  const taluka = pickString(fieldOfficer, 'taluka');
  const assignedArea = pickString(fieldOfficer, 'assigned_area', 'address');

  if (assignedArea !== '-') {
    return assignedArea;
  }

  if (taluka !== '-' && district !== '-') {
    return `${taluka}, ${district}`;
  }

  if (district !== '-') {
    return district;
  }

  return 'Assigned Region';
}

function formatStatusLabel(status: string): string {
  if (!status || status === '-') {
    return 'Active';
  }

  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function parseAssignedTalukas(fieldOfficer: ApiRecord): FieldOfficerAssignedTaluka[] {
  return extractList(fieldOfficer, ['assigned_talukas'])
    .map((taluka) => ({
      id: parseNumber(taluka.id),
      name: pickString(taluka, 'name'),
    }))
    .filter((taluka) => taluka.id > 0 && taluka.name !== '-');
}

function parseGovernmentId(fieldOfficer: ApiRecord): FieldOfficerGovernmentIdInfo {
  const governmentId = (fieldOfficer.government_id ?? {}) as ApiRecord;

  return {
    type: pickString(governmentId, 'type') !== '-' ? pickString(governmentId, 'type') : null,
    label: pickString(governmentId, 'label') !== '-' ? pickString(governmentId, 'label') : null,
    lastFour: pickString(governmentId, 'last_four') !== '-' ? pickString(governmentId, 'last_four') : null,
    verifiedByBhuguard: Boolean(governmentId.verified_by_bhuguard),
    available: Boolean(governmentId.available),
    viewUrl: resolveMediaUrl(pickString(governmentId, 'view_url') !== '-' ? pickString(governmentId, 'view_url') : null),
  };
}

function parseAppointmentLetter(fieldOfficer: ApiRecord): FieldOfficerAppointmentLetterInfo {
  const appointmentLetter = (fieldOfficer.appointment_letter ?? {}) as ApiRecord;

  return {
    available: Boolean(appointmentLetter.available),
    downloadUrl:
      pickString(appointmentLetter, 'download_url') !== '-'
        ? pickString(appointmentLetter, 'download_url')
        : null,
  };
}

function buildPerformanceStats(dashboard: ApiRecord): FieldOfficerPerformanceStats {
  const assignmentStatus = (dashboard.assignment_status ?? {}) as ApiRecord;
  const approvedCount = parseNumber(assignmentStatus.approved);
  const reviewCount = parseNumber(assignmentStatus.submitted_to_admin);
  const pendingCount = parseNumber(assignmentStatus.pending);
  const correctionCount = parseNumber(assignmentStatus.correction_requested);
  const rejectedCount = parseNumber(assignmentStatus.rejected);
  const totalReports =
    parseNumber(assignmentStatus.total_assignments) ||
    approvedCount + reviewCount + pendingCount + correctionCount + rejectedCount;

  return {
    visitsCompleted: approvedCount,
    accuracyPercent: totalReports > 0 ? Math.round((approvedCount / Math.max(totalReports, 1)) * 100) : 0,
    totalAssignments: totalReports,
    pending: pendingCount,
    submittedToAdmin: reviewCount,
    approved: approvedCount,
    correctionRequested: correctionCount,
    rejected: rejectedCount,
  };
}

export function useFieldOfficerProfileData() {
  const [data, setData] = useState<FieldOfficerProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [user, profileData, dashboardData] = await Promise.all([
        getAuthUser(),
        loadOptional(() => getFieldOfficerProfile(), { user: {} }),
        loadOptional(() => getFieldOfficerDashboard(), { dashboard: {} }),
      ]);

      const profileUser = (profileData.user ?? profileData) as ApiRecord;
      const fieldOfficer = (profileUser.field_officer_profile ??
        profileUser.field_officer ??
        profileUser.fieldOfficer ??
        {}) as ApiRecord;
      const dashboard = (dashboardData.dashboard ?? dashboardData) as ApiRecord;
      const performance = buildPerformanceStats(dashboard);

      const status = pickString(profileUser, 'status', 'field_officer_profile.status');
      const officerStatus = pickString(fieldOfficer, 'status');
      const designation = pickString(fieldOfficer, 'designation');

      setData({
        officerName: user?.name ?? pickString(profileUser, 'name') ?? 'Field Officer',
        officerCode:
          pickString(fieldOfficer, 'field_officer_id') !== '-'
            ? pickString(fieldOfficer, 'field_officer_id')
            : pickString(fieldOfficer, 'officer_code') !== '-'
              ? pickString(fieldOfficer, 'officer_code')
              : pickString(dashboard, 'officer_code') !== '-'
                ? pickString(dashboard, 'officer_code')
                : 'ID Pending',
        roleLabel: designation !== '-' ? designation : 'Field Verification Officer',
        regionLabel: buildRegionLabel(fieldOfficer),
        statusLabel: formatStatusLabel(officerStatus !== '-' ? officerStatus : status),
        isActive: (officerStatus !== '-' ? officerStatus : status).toLowerCase() === 'active' || status === '-',
        mobile: pickString(profileUser, 'mobile'),
        email: pickString(profileUser, 'email'),
        state: pickString(fieldOfficer, 'state'),
        district: pickString(fieldOfficer, 'district'),
        assignedArea: pickString(fieldOfficer, 'assigned_area', 'address'),
        photoUrl: resolveMediaUrl(pickString(fieldOfficer, 'photo_url') !== '-' ? pickString(fieldOfficer, 'photo_url') : null),
        assignedTalukas: parseAssignedTalukas(fieldOfficer),
        governmentId: parseGovernmentId(fieldOfficer),
        appointmentLetter: parseAppointmentLetter(fieldOfficer),
        performance,
      });
    } catch (err) {
      if (isNetworkError(err)) {
        setError(NETWORK_ERROR_MESSAGE);
      } else {
        setError(getApiErrorMessage(err, 'Failed to load profile.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePhotoUrl = useCallback((photoUrl: string | null) => {
    setData((current) => (current ? { ...current, photoUrl } : current));
  }, []);

  return { data, loading, error, reload: load, updatePhotoUrl };
}

export type FieldOfficerProfileSectionKey = 'personal' | 'work' | 'documents' | 'security';
