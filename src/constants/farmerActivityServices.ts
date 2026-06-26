export const FARMER_UPCOMING_SERVICE_MESSAGE =
  'This service is coming soon. Currently Biochar service is active.';

export type FarmerActivityServiceStatus = 'active' | 'upcoming';

export interface FarmerActivityServiceItem {
  id: number;
  code: string;
  name: string;
  status: FarmerActivityServiceStatus;
  statusLabel: string;
  canOpen: boolean;
}

export const FARMER_ACTIVITY_SERVICE_FALLBACK: FarmerActivityServiceItem[] = [
  {
    id: 0,
    code: 'BIOCHAR',
    name: 'Biochar',
    status: 'active',
    statusLabel: 'Active',
    canOpen: true,
  },
  {
    id: 0,
    code: 'REG_AGRI',
    name: 'Regenerative Agriculture',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    canOpen: false,
  },
  {
    id: 0,
    code: 'AGRO_FORESTRY',
    name: 'Agroforestry',
    status: 'upcoming',
    statusLabel: 'Upcoming',
    canOpen: false,
  },
];

export const FARMER_ACTIVITY_SERVICE_CODES = new Set(['BIOCHAR', 'REG_AGRI', 'AGRO_FORESTRY']);
