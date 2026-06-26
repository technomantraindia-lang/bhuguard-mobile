import {
  INVENTORY_VERIFICATION_CHECKLIST,
  type InventoryEvidenceCategory,
  type InventoryVerificationResult,
} from '../constants/inventoryVerificationChecklist';
import { extractList, pickNestedString, pickString, type ApiRecord } from './apiHelpers';

export interface InventoryVerificationListItem {
  id: number;
  taskCode: string;
  itemName: string;
  movementType: string;
  movementTypeLabel: string;
  storageLocation: string;
  farmerName: string;
  farmName: string;
  assignedDateLabel: string;
  dueDateLabel: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  expectedQuantityLabel: string;
  completionPercent: number;
}

export interface InventoryVerificationViewModel {
  id: number;
  taskCode: string;
  itemName: string;
  movementType: string;
  movementTypeLabel: string;
  storageLocation: string;
  farmerName: string;
  farmName: string;
  assignedDateLabel: string;
  dueDateLabel: string;
  verificationStatus: string;
  verificationStatusLabel: string;
  expectedQuantity: string;
  expectedQuantityLabel: string;
  quantityUnit: string;
  movement: ApiRecord;
  checklist: Array<{ key: string; label: string; checked: boolean }>;
  stockVerification: ApiRecord;
  storageVerification: ApiRecord;
  farmDeliveryVerification: ApiRecord;
  movementVerification: ApiRecord;
  evidence: Array<{ category: string; url: string | null; notes: string | null; uploadedAt: string | null }>;
  evidenceCount: number;
  gpsVerified: boolean;
  gpsFlagged: boolean;
  officerRemarks: string;
  correctionNotes: string;
  requiredChanges: string;
  rejectionReason: string;
  verificationResult: InventoryVerificationResult | null;
  completionPercent: number;
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return 0;
}

function readRecord(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as ApiRecord) : {};
}

function readEvidence(value: unknown): InventoryVerificationViewModel['evidence'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => {
    const record = readRecord(item);

    return {
      category: pickString(record, 'category'),
      url: pickString(record, 'url') !== '-' ? pickString(record, 'url') : null,
      notes: pickString(record, 'notes') !== '-' ? pickString(record, 'notes') : null,
      uploadedAt: pickString(record, 'uploaded_at') !== '-' ? pickString(record, 'uploaded_at') : null,
    };
  });
}

function readChecklist(value: unknown): InventoryVerificationViewModel['checklist'] {
  const saved = Array.isArray(value) ? value : [];
  const savedByKey = new Map(saved.map((item) => [pickString(readRecord(item), 'key'), readRecord(item)]));

  return INVENTORY_VERIFICATION_CHECKLIST.map((item) => {
    const record = savedByKey.get(item.key) ?? {};

    return {
      key: item.key,
      label: item.label,
      checked: Boolean(record.checked),
    };
  });
}

export function mapInventoryVerificationListItem(record: ApiRecord): InventoryVerificationListItem {
  return {
    id: readNumber(record.id),
    taskCode: pickString(record, 'task_code'),
    itemName: pickString(record, 'item_name'),
    movementType: pickString(record, 'movement_type'),
    movementTypeLabel: pickString(record, 'movement_type_label', 'movement_type'),
    storageLocation: pickString(record, 'storage_location'),
    farmerName: pickString(record, 'farmer_name'),
    farmName: pickString(record, 'farm_name'),
    assignedDateLabel: pickString(record, 'assigned_date_label', 'assigned_date'),
    dueDateLabel: pickString(record, 'due_date_label', 'due_date'),
    verificationStatus: pickString(record, 'verification_status'),
    verificationStatusLabel: pickString(record, 'verification_status_label', 'verification_status'),
    expectedQuantityLabel: pickString(record, 'expected_quantity_label'),
    completionPercent: readNumber(record.completion_percent),
  };
}

export function mapInventoryVerificationTask(record: ApiRecord): InventoryVerificationViewModel {
  const verificationResult = pickString(record, 'verification_result');

  return {
    id: readNumber(record.id),
    taskCode: pickString(record, 'task_code'),
    itemName: pickString(record, 'item_name'),
    movementType: pickString(record, 'movement_type'),
    movementTypeLabel: pickString(record, 'movement_type_label', 'movement_type'),
    storageLocation: pickString(record, 'storage_location'),
    farmerName: pickString(record, 'farmer_name'),
    farmName: pickString(record, 'farm_name'),
    assignedDateLabel: pickString(record, 'assigned_date_label', 'assigned_date'),
    dueDateLabel: pickString(record, 'due_date_label', 'due_date'),
    verificationStatus: pickString(record, 'verification_status'),
    verificationStatusLabel: pickString(record, 'verification_status_label', 'verification_status'),
    expectedQuantity: pickString(record, 'expected_quantity'),
    expectedQuantityLabel: pickString(record, 'expected_quantity_label', 'expected_quantity'),
    quantityUnit: pickString(record, 'quantity_unit') !== '-' ? pickString(record, 'quantity_unit') : 'kg',
    movement: readRecord(record.movement),
    checklist: readChecklist(record.checklist),
    stockVerification: readRecord(record.stock_verification),
    storageVerification: readRecord(record.storage_verification),
    farmDeliveryVerification: readRecord(record.farm_delivery_verification),
    movementVerification: readRecord(record.movement_verification),
    evidence: readEvidence(record.evidence),
    evidenceCount: readNumber(record.evidence_count),
    gpsVerified: Boolean(record.gps_verified),
    gpsFlagged: Boolean(record.gps_flagged),
    officerRemarks: pickString(record, 'officer_remarks') !== '-' ? pickString(record, 'officer_remarks') : '',
    correctionNotes: pickString(record, 'correction_notes') !== '-' ? pickString(record, 'correction_notes') : '',
    requiredChanges: pickString(record, 'required_changes') !== '-' ? pickString(record, 'required_changes') : '',
    rejectionReason: pickString(record, 'rejection_reason') !== '-' ? pickString(record, 'rejection_reason') : '',
    verificationResult:
      verificationResult === 'verified' ||
      verificationResult === 'correction_required' ||
      verificationResult === 'rejected'
        ? verificationResult
        : null,
    completionPercent: readNumber(record.completion_percent),
  };
}

export function extractInventoryVerificationTasks(data: ApiRecord): InventoryVerificationListItem[] {
  return extractList(data, ['inventory_tasks', 'tasks']).map(mapInventoryVerificationListItem);
}

export function isFarmDeliveryTask(task: InventoryVerificationViewModel): boolean {
  return task.movementType === 'storage_to_farm';
}

export function buildChecklistPayload(checked: Record<string, boolean>): Array<{ key: string; checked: boolean }> {
  return INVENTORY_VERIFICATION_CHECKLIST.map((item) => ({
    key: item.key,
    checked: Boolean(checked[item.key]),
  }));
}

export function buildSubmitReportPayload(options: {
  checklist: Record<string, boolean>;
  verificationResult: InventoryVerificationResult;
  officerRemarks: string;
  correctionNotes?: string;
  requiredChanges?: string;
  rejectionReason?: string;
  gpsVerified?: boolean;
  gpsFlagged?: boolean;
}): ApiRecord {
  return {
    checklist: buildChecklistPayload(options.checklist),
    verification_result: options.verificationResult,
    officer_remarks: options.officerRemarks,
    correction_notes: options.correctionNotes ?? null,
    required_changes: options.requiredChanges ?? null,
    rejection_reason: options.rejectionReason ?? null,
    gps_verified: options.gpsVerified ?? false,
    gps_flagged: options.gpsFlagged ?? false,
  };
}

export function formatQuantityDifference(expected: number, actual: number): number {
  return Math.round((actual - expected) * 10000) / 10000;
}

export function evidenceCountForCategory(
  evidence: InventoryVerificationViewModel['evidence'],
  category: InventoryEvidenceCategory,
): number {
  return evidence.filter((item) => item.category === category).length;
}

export function movementSummaryLine(task: InventoryVerificationViewModel, key: string): string {
  return pickString(task.movement, key) !== '-' ? pickString(task.movement, key) : pickNestedString(task.movement, key);
}
