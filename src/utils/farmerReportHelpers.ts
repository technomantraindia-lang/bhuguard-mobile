import type { BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';
import {
  FARMER_REPORT_CATALOG,
  type FarmerReportCatalogEntry,
} from '../constants/farmerReportCatalog';
import { pickNestedString, pickString, type ApiRecord } from './apiHelpers';

export type ReportStatusBadge = 'available' | 'verified' | 'updated' | 'pending';
export type ReportSourceType =
  | 'final_report'
  | 'baseline'
  | 'carbon'
  | 'verification'
  | 'activity'
  | 'soil';

export interface FarmerReportItem {
  id: string;
  catalogId: string;
  sourceType: ReportSourceType;
  sourceId: number;
  title: string;
  description: string;
  updatedLabel: string;
  updatedAt: string | null;
  statusBadge: ReportStatusBadge;
  icon: BhuguardIconName;
  downloadAvailable: boolean;
  iconTone?: 'default' | 'verified';
}

export interface FarmerReportHistoryItem {
  id: string;
  dateLabel: string;
  title: string;
  subtitle?: string;
  isPrimary: boolean;
  sortKey: number;
}

export interface FarmerReportsSummary {
  estimatedGenerated: number;
  targetGenerated: number;
  progressPercent: number;
  isActive: boolean;
  totalReports: number;
  downloadedCount: number;
  pendingCount: number;
  estimatedCredits: number;
  approvedCredits: number;
  pendingCredits: number;
}

function parseNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUpdatedLabel(value: unknown): string {
  const raw = pickString({ value }, 'value');

  if (raw === '-' || !raw) {
    return 'Updated: —';
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return `Updated: ${raw}`;
  }

  return `Updated: ${date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
}

function toSortKey(value: unknown): number {
  const raw = String(value ?? '');

  if (!raw || raw === '-') {
    return 0;
  }

  const date = new Date(raw);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatHistoryDate(value: unknown): string {
  const raw = String(value ?? '');

  if (!raw || raw === '-') {
    return '—';
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function mapFinalReportStatus(status: string): ReportStatusBadge {
  const normalized = status.toLowerCase();

  if (['verified', 'approved'].includes(normalized)) {
    return 'verified';
  }

  if (['updated', 'completed'].includes(normalized)) {
    return 'updated';
  }

  if (['pending', 'draft', 'in_progress'].includes(normalized)) {
    return 'pending';
  }

  return 'available';
}

function catalogDescriptionFor(catalogId: string, fallback = 'Official farm verification report'): string {
  const entry = FARMER_REPORT_CATALOG.find((row) => row.catalogId === catalogId);

  return entry?.description ?? fallback;
}

export function buildCatalogReports(apiReports: FarmerReportItem[]): FarmerReportItem[] {
  const catalogById = new Map(FARMER_REPORT_CATALOG.map((entry) => [entry.catalogId, entry]));

  return apiReports
    .filter((report) => report.sourceId > 0)
    .map((report) => {
      const entry = catalogById.get(report.catalogId);

      if (!entry) {
        return report;
      }

      return {
        ...report,
        title: entry.title,
        description: entry.description,
        icon: entry.icon,
        iconTone: entry.iconTone ?? report.iconTone,
        statusBadge:
          entry.statusBadge === 'verified' || entry.statusBadge === 'updated'
            ? entry.statusBadge
            : report.statusBadge,
      };
    });
}

function withCatalogMeta(item: FarmerReportItem, catalogId: string): FarmerReportItem {
  const entry = FARMER_REPORT_CATALOG.find((row) => row.catalogId === catalogId);

  return {
    ...item,
    catalogId,
    description: entry?.description ?? item.description ?? 'Official farm verification report',
  };
}

function mapBaselineStatus(status: string): ReportStatusBadge {
  const normalized = status.toLowerCase();

  if (['approved', 'verified'].includes(normalized)) {
    return 'verified';
  }

  if (['updated', 'submitted'].includes(normalized)) {
    return 'updated';
  }

  return 'available';
}

export function buildFinalReportItems(reports: ApiRecord[]): FarmerReportItem[] {
  return reports.map((report) => {
    const serviceName = pickString(report, 'service_name');
    const title =
      serviceName !== '-'
        ? `${serviceName} Report`
        : `Report ${pickString(report, 'report_number', 'id')}`;

    return withCatalogMeta(
      {
        id: `final-${report.id}`,
        catalogId: 'final',
        sourceType: 'final_report',
        sourceId: Number(report.id),
        title,
        description: 'Official generated farm report',
        updatedLabel: formatUpdatedLabel(report.generated_at ?? report.approved_at ?? report.created_at),
        updatedAt: pickString(report, 'generated_at', 'approved_at', 'created_at'),
        statusBadge: mapFinalReportStatus(pickString(report, 'report_status', 'status')),
        icon: 'assignment',
        downloadAvailable: report.download_available === true,
        iconTone: mapFinalReportStatus(pickString(report, 'report_status', 'status')) === 'verified' ? 'verified' : 'default',
      },
      'final',
    );
  });
}

export function buildBaselineReportItems(assessments: ApiRecord[]): FarmerReportItem[] {
  if (assessments.length === 0) {
    return [];
  }

  const latest = [...assessments].sort(
    (left, right) =>
      toSortKey(right.assessment_date ?? right.created_at) - toSortKey(left.assessment_date ?? left.created_at),
  )[0];

  return [
    withCatalogMeta(
      {
        id: `baseline-${latest.id}`,
        catalogId: 'baseline',
        sourceType: 'baseline',
        sourceId: Number(latest.id),
        title: 'Baseline Assessment Report',
        description: catalogDescriptionFor('baseline'),
        updatedLabel: formatUpdatedLabel(latest.assessment_date ?? latest.created_at),
        updatedAt: pickString(latest, 'assessment_date', 'created_at'),
        statusBadge: mapBaselineStatus(pickString(latest, 'status')),
        icon: 'analytics',
        downloadAvailable: true,
      },
      'baseline',
    ),
  ];
}

export function buildCarbonReportItems(calculations: ApiRecord[]): FarmerReportItem[] {
  if (calculations.length === 0) {
    return [];
  }

  const latest = [...calculations].sort(
    (left, right) => toSortKey(right.calculated_at ?? right.approved_at) - toSortKey(left.calculated_at ?? left.approved_at),
  )[0];

  return [
    withCatalogMeta(
      {
        id: `carbon-${latest.id}`,
        catalogId: 'monitoring',
        sourceType: 'carbon',
        sourceId: Number(latest.id),
        title: 'Monitoring Report',
        description: catalogDescriptionFor('monitoring'),
        updatedLabel: formatUpdatedLabel(latest.calculated_at ?? latest.approved_at ?? latest.created_at),
        updatedAt: pickString(latest, 'calculated_at', 'approved_at', 'created_at'),
        statusBadge: pickString(latest, 'status').toLowerCase() === 'approved' ? 'verified' : 'available',
        icon: 'science',
        downloadAvailable: latest.final_report_available === true,
      },
      'monitoring',
    ),
  ];
}

export function buildVerificationReportItems(assignments: ApiRecord[]): FarmerReportItem[] {
  const verified = assignments.find((assignment) => {
    const status = pickString(assignment, 'assignment_status', 'status').toLowerCase();
    const adminStatus = pickNestedString(assignment, 'verification_report.admin_review_status').toLowerCase();

    return ['approved', 'completed', 'verified'].includes(status) || adminStatus === 'approved';
  });

  if (!verified) {
    return [];
  }

  const verificationReport = (verified.verification_report ?? {}) as ApiRecord;
  const checklist = (verified.checklist ?? {}) as ApiRecord;

  return [
    withCatalogMeta(
      {
        id: `verification-${verified.id}`,
        catalogId: 'verification',
        sourceType: 'verification',
        sourceId: Number(verified.id),
        title: 'Verification Report',
        description: catalogDescriptionFor('verification'),
        updatedLabel: formatUpdatedLabel(
          verificationReport.completed_at ?? checklist.completed_at ?? verified.updated_at ?? verified.created_at,
        ),
        updatedAt: pickString(verified, 'updated_at', 'created_at'),
        statusBadge: 'verified',
        icon: 'verified',
        downloadAvailable: true,
        iconTone: 'verified',
      },
      'verification',
    ),
  ];
}

export function buildActivityReportItems(activityLogs: ApiRecord[]): FarmerReportItem[] {
  if (activityLogs.length === 0) {
    return [];
  }

  const latest = [...activityLogs].sort(
    (left, right) => toSortKey(right.activity_date ?? right.created_at) - toSortKey(left.activity_date ?? left.created_at),
  )[0];

  return [
    withCatalogMeta(
      {
        id: `activity-${latest.id}`,
        catalogId: 'activity',
        sourceType: 'activity',
        sourceId: Number(latest.id),
        title: 'Activity Submission Report',
        description: catalogDescriptionFor('activity', 'Summary of submitted activities'),
        updatedLabel: formatUpdatedLabel(latest.activity_date ?? latest.created_at),
        updatedAt: pickString(latest, 'activity_date', 'created_at'),
        statusBadge: 'updated',
        icon: 'assignment',
        downloadAvailable: true,
      },
      'activity',
    ),
  ];
}

export function buildSoilHealthReportItems(soilSamples: ApiRecord[], assessments: ApiRecord[]): FarmerReportItem[] {
  const source = soilSamples[0] ?? assessments[0];

  if (!source) {
    return [];
  }

  return [
    withCatalogMeta(
      {
        id: `soil-${source.id}`,
        catalogId: 'soil',
        sourceType: soilSamples.length > 0 ? 'soil' : 'baseline',
        sourceId: Number(source.id),
        title: 'Soil Health Report',
        description: catalogDescriptionFor('soil', 'Latest soil assessment report'),
        updatedLabel: formatUpdatedLabel(source.sample_date ?? source.assessment_date ?? source.created_at),
        updatedAt: pickString(source, 'sample_date', 'assessment_date', 'created_at'),
        statusBadge: 'available',
        icon: 'agriculture',
        downloadAvailable: true,
      },
      'soil',
    ),
  ];
}

export function mergeReportItems(groups: FarmerReportItem[][]): FarmerReportItem[] {
  const merged = groups.flat();

  return merged.sort((left, right) => toSortKey(right.updatedAt) - toSortKey(left.updatedAt));
}

export function buildReportHistory(
  items: FarmerReportItem[],
  activityLogs: ApiRecord[],
  assignments: ApiRecord[],
): FarmerReportHistoryItem[] {
  const history: FarmerReportHistoryItem[] = [];

  const monitoring = items.find((item) => item.catalogId === 'monitoring');
  const verification = items.find((item) => item.catalogId === 'verification');
  const soil = items.find((item) => item.catalogId === 'soil');

  if (monitoring?.updatedAt) {
    history.push({
      id: 'history-monitoring',
      title: 'Monitoring Report',
      dateLabel: formatHistoryDate(monitoring.updatedAt),
      isPrimary: true,
      sortKey: toSortKey(monitoring.updatedAt),
    });
  }

  if (verification?.updatedAt) {
    history.push({
      id: 'history-verification',
      title: 'Verification Report',
      dateLabel: formatHistoryDate(verification.updatedAt),
      isPrimary: false,
      sortKey: toSortKey(verification.updatedAt),
    });
  }

  if (soil?.updatedAt) {
    history.push({
      id: 'history-soil',
      title: 'Soil Report',
      dateLabel: formatHistoryDate(soil.updatedAt),
      isPrimary: false,
      sortKey: toSortKey(soil.updatedAt),
    });
  }

  if (history.length === 0) {
    return [];
  }

  return history.sort((left, right) => right.sortKey - left.sortKey).slice(0, 3);
}

export function buildReportsSummary(
  reports: FarmerReportItem[],
  calculations: ApiRecord[],
): FarmerReportsSummary {
  const estimatedGeneratedRaw = calculations.reduce(
    (total, item) => total + parseNumber(item.estimated_carbon_credit ?? item.estimated_co2e),
    0,
  );
  const approvedGenerated = calculations
    .filter((item) => pickString(item, 'status').toLowerCase() === 'approved')
    .reduce((total, item) => total + parseNumber(item.estimated_carbon_credit ?? item.estimated_co2e), 0);

  const estimatedGenerated = estimatedGeneratedRaw;
  const targetGenerated =
    estimatedGeneratedRaw > 0 ? Math.max(25, Math.ceil(estimatedGenerated * 1.7)) : 0;
  const progressPercent =
    targetGenerated > 0
      ? Math.min(100, Math.round((estimatedGenerated / targetGenerated) * 100))
      : 0;

  const downloadable = reports.filter((report) => report.downloadAvailable).length;
  const estimatedCreditsRaw = Math.round(estimatedGeneratedRaw * 100);
  const approvedCreditsRaw = Math.round(approvedGenerated * 100);

  return {
    estimatedGenerated,
    targetGenerated,
    progressPercent,
    isActive: reports.length > 0 || calculations.length > 0,
    totalReports: reports.length,
    downloadedCount: downloadable,
    pendingCount: Math.max(0, reports.length - downloadable),
    estimatedCredits: estimatedCreditsRaw,
    approvedCredits: approvedCreditsRaw,
    pendingCredits: Math.max(0, estimatedCreditsRaw - approvedCreditsRaw),
  };
}

export type ReportFilterMode = 'all' | 'available' | 'verified' | 'updated';

export function filterReports(reports: FarmerReportItem[], mode: ReportFilterMode): FarmerReportItem[] {
  if (mode === 'all') {
    return reports;
  }

  return reports.filter((report) => {
    switch (mode) {
      case 'available':
        return report.statusBadge === 'available' || report.statusBadge === 'pending';
      case 'verified':
        return report.statusBadge === 'verified';
      case 'updated':
        return report.statusBadge === 'updated';
      default:
        return true;
    }
  });
}
