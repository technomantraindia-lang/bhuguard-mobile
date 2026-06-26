import type { ApiRecord } from './apiHelpers';
import { pickNestedString, pickString } from './apiHelpers';

export interface BatchInventoryOption {
  id: number;
  batchCode: string;
  productionDateLabel: string;
  feedstockType: string;
  productionQty: string;
  currentStockKg: number;
  storageStatus: string;
  inventory: {
    availableKg: number;
    reservedKg: number;
    movedKg: number;
    balanceKg: number;
  };
}

export interface StorageLocationOption {
  key: string;
  label: string;
  capacityKg: number;
  availableSpaceKg: number;
}

export interface DestinationFarmOption {
  farmerId: number;
  farmerName: string;
  farmerCode: string;
  farmId: number;
  farmName: string;
  farmCode: string;
  plotId: number | null;
  plotCode: string;
  latitude: number | null;
  longitude: number | null;
}

export function mapBatchInventoryOption(record: ApiRecord): BatchInventoryOption {
  const inventory = (record.inventory ?? {}) as ApiRecord;

  return {
    id: Number(record.id ?? 0),
    batchCode: pickString(record, 'batch_code', 'batchCode'),
    productionDateLabel: pickString(record, 'production_date_label', 'productionDateLabel', 'production_date'),
    feedstockType: pickString(record, 'feedstock_type', 'feedstockType'),
    productionQty: `${pickString(record, 'biochar_output', 'biocharOutput')} ${pickString(record, 'biochar_output_unit', 'biocharOutputUnit', 'kg')}`,
    currentStockKg: Number(inventory.available_kg ?? record.current_stock_kg ?? 0),
    storageStatus: pickString(record, 'storage_status', 'storageStatus') || 'stored',
    inventory: {
      availableKg: Number(inventory.available_kg ?? 0),
      reservedKg: Number(inventory.reserved_kg ?? 0),
      movedKg: Number(inventory.moved_kg ?? 0),
      balanceKg: Number(inventory.balance_kg ?? 0),
    },
  };
}

export function mapStorageLocation(record: ApiRecord): StorageLocationOption {
  return {
    key: pickString(record, 'key'),
    label: pickString(record, 'label'),
    capacityKg: Number(record.capacity_kg ?? 0),
    availableSpaceKg: Number(record.available_space_kg ?? 0),
  };
}

export function mapDestinationOptions(farmers: ApiRecord[]): DestinationFarmOption[] {
  const options: DestinationFarmOption[] = [];

  for (const farmerRecord of farmers) {
    const farmerName = pickString(farmerRecord, 'name');
    const farmerCode = pickString(farmerRecord, 'farmer_code', 'farmerCode');
    const farmerId = Number(farmerRecord.id ?? 0);
    const farms = Array.isArray(farmerRecord.farms) ? (farmerRecord.farms as ApiRecord[]) : [];

    for (const farmRecord of farms) {
      const plots = Array.isArray(farmRecord.plots) ? (farmRecord.plots as ApiRecord[]) : [];
      const plot = plots[0];

      options.push({
        farmerId,
        farmerName: farmerName !== '-' ? farmerName : 'Farmer',
        farmerCode: farmerCode !== '-' ? farmerCode : `BHG-FRM-${String(farmerId).padStart(6, '0')}`,
        farmId: Number(farmRecord.id ?? 0),
        farmName: pickString(farmRecord, 'farm_name', 'farmName'),
        farmCode: pickString(farmRecord, 'farm_code', 'farmCode'),
        plotId: plot ? Number(plot.id ?? 0) : null,
        plotCode: plot ? pickString(plot, 'plot_code', 'plotCode') : '—',
        latitude: readCoordinate(farmRecord.latitude),
        longitude: readCoordinate(farmRecord.longitude),
      });
    }
  }

  return options.filter((option) => option.farmId > 0);
}

function readCoordinate(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function formatInventoryQuantity(value: number, unit = 'Kg'): string {
  return `${value.toLocaleString()} ${unit}`;
}
