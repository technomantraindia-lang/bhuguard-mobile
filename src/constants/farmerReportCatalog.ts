import type { BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';
import type { ReportSourceType, ReportStatusBadge } from '../utils/farmerReportHelpers';

export interface FarmerReportCatalogEntry {
  catalogId: string;
  title: string;
  description: string;
  icon: BhuguardIconName;
  statusBadge: ReportStatusBadge;
  sourceType: ReportSourceType;
  iconTone?: 'default' | 'verified';
}

export const FARMER_REPORT_CATALOG: FarmerReportCatalogEntry[] = [
  {
    catalogId: 'verification',
    title: 'Verification Report',
    description: 'Field officer verification summary',
    icon: 'verified',
    statusBadge: 'verified',
    sourceType: 'verification',
    iconTone: 'verified',
  },
  {
    catalogId: 'monitoring',
    title: 'Monitoring Report',
    description: 'Carbon monitoring summary',
    icon: 'science',
    statusBadge: 'available',
    sourceType: 'carbon',
  },
  {
    catalogId: 'baseline',
    title: 'Baseline Assessment Report',
    description: 'Initial farm baseline assessment',
    icon: 'analytics',
    statusBadge: 'available',
    sourceType: 'baseline',
  },
];

export const DEFAULT_REPORT_HISTORY = [
  { id: 'history-monitoring', title: 'Monitoring Report', dateLabel: '15 Jun 2026', isPrimary: true },
  { id: 'history-verification', title: 'Verification Report', dateLabel: '02 Jun 2026', isPrimary: false },
  { id: 'history-soil', title: 'Soil Report', dateLabel: '25 May 2026', isPrimary: false },
] as const;

export const DESIGN_REPORT_SUMMARY = {
  estimatedGenerated: 14.8,
  targetGenerated: 25,
  progressPercent: 60,
  totalReports: 12,
  downloadedCount: 8,
  pendingCount: 2,
  estimatedCredits: 1250,
  approvedCredits: 900,
  pendingCredits: 350,
} as const;
