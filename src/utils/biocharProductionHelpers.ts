import { pickString, type ApiRecord } from './apiHelpers';

export interface ProductionUnitOption {
  id: number;
  label: string;
  kilnId: string;
  operatorName: string | null;
}

export function mapProductionUnit(record: ApiRecord): ProductionUnitOption {
  const kilnId = pickString(record, 'kiln_id', 'kilnId');
  const label = pickString(record, 'label');

  return {
    id: Number(record.id ?? 0),
    label: label !== '-' ? label : kilnId !== '-' ? kilnId : 'Production Unit',
    kilnId: kilnId !== '-' ? kilnId : '',
    operatorName: pickString(record, 'operator_name', 'operatorName') !== '-'
      ? pickString(record, 'operator_name', 'operatorName')
      : null,
  };
}

export function formatCoordinate(value: number | null, direction: 'N' | 'E'): string {
  if (value == null) {
    return '—';
  }

  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}

export function formatProductionDuration(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) {
    return null;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if ([startHour, startMinute, endHour, endMinute].some((part) => Number.isNaN(part))) {
    return null;
  }

  const startTotal = startHour * 60 + startMinute;
  let endTotal = endHour * 60 + endMinute;

  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  const diff = endTotal - startTotal;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export function calculateYieldPercent(feedstockQuantity: string, biocharOutput: string): string | null {
  const input = Number(feedstockQuantity);
  const output = Number(biocharOutput);

  if (!Number.isFinite(input) || !Number.isFinite(output) || input <= 0) {
    return null;
  }

  return `${((output / input) * 100).toFixed(1)}%`;
}

export function formatTodayLabel(): string {
  const now = new Date();
  return `Today, ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}
