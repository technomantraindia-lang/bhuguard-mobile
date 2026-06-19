import type { ApiRecord } from './apiHelpers';
import { pickString } from './apiHelpers';

export type FieldOfficerReportStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'correction';

export type FieldOfficerReportFilter =
  | 'all'
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'correction';

export interface FieldOfficerReportItem {
  id: number;
  assignmentId: number;
  reportId: string;
  farmerName: string;
  farmName: string;
  companyName: string | null;
  project: string;
  verificationDate: string;
  status: FieldOfficerReportStatus;
  pdfUrl: string | null;
  isDraft: boolean;
}

export interface FieldOfficerReportSummary {
  totalReports: number;
  draft: number;
  submitted: number;
  pendingReview: number;
}

export function mapFieldOfficerReport(record: ApiRecord): FieldOfficerReportItem {
  const status = normalizeReportStatus(pickString(record, 'status'));

  return {
    id: Number(record.id ?? 0),
    assignmentId: Number(record.assignment_id ?? record.id ?? 0),
    reportId: pickString(record, 'report_id', 'report_code') || `BHG-RPT-${record.id ?? '—'}`,
    farmerName: pickString(record, 'farmer_name') || '—',
    farmName: pickString(record, 'farm_name') || '—',
    companyName: pickString(record, 'company_name') !== '-' ? pickString(record, 'company_name') : null,
    project: pickString(record, 'project') || 'Field Verification',
    verificationDate: pickString(record, 'verification_date') || '—',
    status,
    pdfUrl: pickString(record, 'pdf_url') !== '-' ? pickString(record, 'pdf_url') : null,
    isDraft: Boolean(record.is_draft) || status === 'draft',
  };
}

function normalizeReportStatus(value: string): FieldOfficerReportStatus {
  if (value === 'correction_requested') {
    return 'correction';
  }

  if (
    value === 'draft' ||
    value === 'submitted' ||
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'correction'
  ) {
    return value;
  }

  return 'pending';
}

export function formatReportStatusLabel(status: FieldOfficerReportStatus): string {
  return (
    {
      draft: 'Draft',
      submitted: 'Submitted',
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      correction: 'Correction',
    }[status] ?? 'Pending'
  );
}

export function formatVerificationDateLabel(value: string): string {
  if (!value || value === '—') {
    return '—';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function buildReportSummary(reports: FieldOfficerReportItem[]): FieldOfficerReportSummary {
  return {
    totalReports: reports.length,
    draft: reports.filter((report) => report.status === 'draft').length,
    submitted: reports.filter((report) => report.status === 'submitted').length,
    pendingReview: reports.filter((report) => report.status === 'pending' || report.status === 'submitted').length,
  };
}

export function matchesReportSearch(report: FieldOfficerReportItem, query: string): boolean {
  const haystack = [
    report.reportId,
    report.farmerName,
    report.farmName,
    report.companyName,
    report.project,
    String(report.id),
    String(report.assignmentId),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function filterReportsByStatus(
  reports: FieldOfficerReportItem[],
  filter: FieldOfficerReportFilter,
): FieldOfficerReportItem[] {
  if (filter === 'all') {
    return reports;
  }

  if (filter === 'correction') {
    return reports.filter((report) => report.status === 'correction');
  }

  return reports.filter((report) => report.status === filter);
}

export function reportDownloadKey(report: FieldOfficerReportItem): string {
  return `fo-report-${report.id}`;
}
