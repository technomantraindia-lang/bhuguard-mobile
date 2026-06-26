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

/** UI labels for farmer report types — metadata only, not fake report rows. */
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
