import type { ApiRecord } from './apiHelpers';
import { extractList, pickString } from './apiHelpers';
import {
  FARMER_ACTIVITY_SERVICE_CODES,
  FARMER_ACTIVITY_SERVICE_FALLBACK,
  type FarmerActivityServiceItem,
} from '../constants/farmerActivityServices';

export function mapFarmerServiceRecord(record: ApiRecord): FarmerActivityServiceItem | null {
  const code = pickString(record, 'code');
  const name = pickString(record, 'name', 'service_name');
  const availability = pickString(record, 'availability');

  if (code === '-' || name === '-') {
    return null;
  }

  if (!FARMER_ACTIVITY_SERVICE_CODES.has(code)) {
    return null;
  }

  const isUpcoming = availability === 'upcoming' || record.can_open === false;
  const isBiochar = code === 'BIOCHAR';

  return {
    id: Number(record.id ?? 0),
    code,
    name,
    status: isBiochar ? 'active' : isUpcoming ? 'upcoming' : 'active',
    statusLabel:
      pickString(record, 'availability_label') !== '-'
        ? pickString(record, 'availability_label')
        : isBiochar
          ? 'Active'
          : isUpcoming
            ? 'Upcoming'
            : 'Active',
    canOpen: isBiochar && record.can_open !== false,
  };
}

export function normalizeFarmerServices(records: ApiRecord[]): FarmerActivityServiceItem[] {
  const mapped = records
    .map(mapFarmerServiceRecord)
    .filter((item): item is FarmerActivityServiceItem => item !== null);

  if (mapped.length === 0) {
    return FARMER_ACTIVITY_SERVICE_FALLBACK;
  }

  const order = ['BIOCHAR', 'REG_AGRI', 'AGRO_FORESTRY'];

  return [...mapped].sort((left, right) => order.indexOf(left.code) - order.indexOf(right.code));
}

export function extractFarmerServicesList(data: ApiRecord): FarmerActivityServiceItem[] {
  return normalizeFarmerServices(extractList(data, ['services']));
}
