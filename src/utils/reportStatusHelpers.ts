export type ReportStatusKey =
  | 'draft'
  | 'pending'
  | 'generated'
  | 'approved'
  | 'rejected'
  | 'correction_required'
  | 'correction'
  | 'report_generated'
  | 'submitted'
  | string;

export interface ReportStatusBadgeStyle {
  label: string;
  backgroundColor: string;
  color: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  generated: 'Generated',
  approved: 'Approved',
  rejected: 'Rejected',
  correction_required: 'Correction Required',
  correction: 'Correction Required',
  report_generated: 'Report Generated',
  submitted: 'Submitted',
};

export function normalizeReportStatus(status: string | null | undefined): string {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

export function formatReportStatusLabel(status: string | null | undefined): string {
  const normalized = normalizeReportStatus(status);

  if (!normalized || normalized === '-') {
    return 'Unknown';
  }

  return STATUS_LABELS[normalized] ?? status ?? 'Unknown';
}

export function getReportStatusBadgeStyle(status: string | null | undefined): ReportStatusBadgeStyle {
  const normalized = normalizeReportStatus(status);

  switch (normalized) {
    case 'approved':
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(34, 197, 94, 0.18)',
        color: '#15803d',
      };
    case 'pending':
    case 'submitted':
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        color: '#b45309',
      };
    case 'rejected':
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(239, 68, 68, 0.18)',
        color: '#b91c1c',
      };
    case 'correction_required':
    case 'correction':
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        color: '#c2410c',
      };
    case 'generated':
    case 'report_generated':
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        color: '#1d4ed8',
      };
    case 'draft':
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(107, 114, 128, 0.18)',
        color: '#4b5563',
      };
    default:
      return {
        label: formatReportStatusLabel(status),
        backgroundColor: 'rgba(148, 163, 184, 0.2)',
        color: '#475569',
      };
  }
}
