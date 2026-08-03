import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import type { BiocharEvidenceKey } from '../constants/biocharProduction';
import { isBiocharEvidenceSatisfied } from './biocharEvidenceHydration';
import { isValidMoistureReadingValue } from './moistureReadingValidation';

export const OFFLINE_PACKAGE_SCHEMA_VERSION = 2;

export interface OfflineMoistureReadingSnapshot {
  sequence: number;
  moistureReading: string;
  notes: string;
  photo?: BiocharEvidenceAsset | null;
  readingId?: number | null;
  evidenceId?: number | null;
  uploadStatus?: 'idle' | 'local_pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string | null;
  capturedAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
}

export interface OfflineProductionPayload {
  schema_version: number;
  submission_uuid: string;
  server_batch_id: number | null;
  product_id: string | null;
  batch_code: string;
  kiln_id: string;
  production_unit_id: number | null;
  farmer_id: number;
  farm_id: number;
  artisan_id: number;
  farmer_name: string | null;
  farm_code: string | null;
  production_date: string | null;
  operator_name: string | null;
  feedstock_quantity: string;
  feedstock_unit: string;
  feedstock_type: string;
  feedstock_size: string;
  gps_latitude: number;
  gps_longitude: number;
  gps_accuracy: number | null;
  altitude: number | null;
  village_name: string | null;
  taluka_name: string | null;
  district_name: string | null;
  state_name: string | null;
  moisture_readings: OfflineMoistureReadingSnapshot[];
  batch_started_at: string;
  process_completed_at: string;
  pyrolysis_started_at: string;
  pyrolysis_finished_at: string;
  pyrolysis_duration_seconds: number | null;
  quenching_started_at: string;
  temperature: string;
  residence_time: string;
  biochar_output: string;
  biochar_output_unit: string;
  timestamp_date: string | null;
  timestamp_time: string | null;
  submitted_offline_at: string;
  evidence: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>;
}

export interface OfflineSubmitFormSnapshot {
  batchId: number | null;
  batchCode: string;
  productionRecordCode: string;
  kilnId: string;
  selectedUnitId: number | null;
  selectedFarmerId: number | null;
  farmId: number | null;
  farmerName: string;
  farmCode: string;
  productionDate: string;
  operatorName: string;
  feedstockQuantity: string;
  feedstockUnit: string;
  feedstockType: string;
  feedstockSize: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  altitude: number | null;
  villageName: string;
  talukaName: string;
  districtName: string;
  stateName: string;
  temperature: string;
  residenceTime: string;
  biocharOutput: string;
  biocharOutputUnit: string;
  timestampDate: string;
  timestampTime: string;
  batchStartedAt: string | null;
  processCompletedAt: string | null;
  pyrolysisStartedAt: string | null;
  pyrolysisFinishedAt: string | null;
  pyrolysisDurationSeconds: number | null;
  quenchingStartedAt: string | null;
  moistureReadings: Array<{
    sequence?: number;
    moistureReading: string;
    notes: string;
    photo?: BiocharEvidenceAsset;
  }>;
  evidence: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>;
  /** Phase 19 — audit only; never authoritative. */
  device_utc?: string;
  server_utc?: string;
  clock_skew_ms?: number | null;
  device_time_suspicious?: boolean;
  time_sync_source?: string | null;
  time_detection_at?: string;
  activity_context?: string;
}

const REQUIRED_EVIDENCE: Array<{ key: BiocharEvidenceKey; label: string }> = [
  { key: 'feedstock_photo', label: 'Feedstock Photo' },
  { key: 'starting_pyrolysis_photo', label: 'Pyrolysis Start Image' },
  { key: 'mid_stage_photo', label: 'Mid-Process Image' },
  { key: 'end_stage_before_quenching_photo', label: 'End-Process Image' },
  { key: 'quenching_photo', label: 'Quenching Photo' },
  { key: 'biochar_unloaded_photo', label: 'Unloaded Photo' },
  { key: 'char_sample_photo', label: 'Sample Photo Collection' },
];

export function validateOfflineProductionSnapshot(form: OfflineSubmitFormSnapshot): string[] {
  const missing: string[] = [];

  if (!form.selectedFarmerId) missing.push('Farmer ID');
  if (!form.farmId) missing.push('Farm ID');
  if (!form.batchStartedAt) missing.push('Batch Start Time');
  if (!form.batchCode.trim()) missing.push('Batch ID');
  if (!form.kilnId.trim() && !form.selectedUnitId) missing.push('Kiln ID / Pyrolysis Unit');
  if (form.latitude == null || form.longitude == null) missing.push('GPS location');
  if (form.accuracyM != null && Number(form.accuracyM) > 30) {
    missing.push('GPS accuracy too low — Retry GPS');
  }
  if (form.batchStartedAt && form.processCompletedAt) {
    const startMs = Date.parse(form.batchStartedAt);
    const endMs = Date.parse(form.processCompletedAt);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
      missing.push('Completion must be after Batch Start Time');
    } else if (endMs === startMs) {
      missing.push('Process duration must be greater than zero');
    }
  }
  if (!form.feedstockQuantity.trim() || Number(form.feedstockQuantity) <= 0) {
    missing.push('Feedstock Quantity');
  }
  if (!form.feedstockSize.trim() || Number(form.feedstockSize) <= 0) {
    missing.push('Feedstock Size (cm)');
  }
  if (!form.feedstockType.trim()) missing.push('Feedstock Type');

  const readings = form.moistureReadings.slice(0, 5);
  for (let i = 0; i < 5; i += 1) {
    const reading = readings[i];
    if (!reading?.moistureReading.trim()) {
      missing.push(`Moisture Reading ${i + 1}`);
    } else if (!isValidMoistureReadingValue(reading.moistureReading)) {
      missing.push(`Moisture Reading ${i + 1} must be less than 20`);
    }
    if (!isBiocharEvidenceSatisfied(reading?.photo)) {
      missing.push(`Moisture Reading ${i + 1} live photo`);
    }
  }

  if (!form.processCompletedAt) missing.push('Completion Time');
  if (!form.temperature.trim()) missing.push('Process Data temperature');
  if (!form.residenceTime.trim()) missing.push('Process Data residence time');
  if (!form.biocharOutput.trim()) missing.push('Process Data biochar output');

  for (const item of REQUIRED_EVIDENCE) {
    if (!isBiocharEvidenceSatisfied(form.evidence[item.key])) {
      missing.push(item.label);
    }
  }

  return missing;
}

export function buildOfflineProductionPayload(params: {
  submissionUuid: string;
  artisanId: number;
  form: OfflineSubmitFormSnapshot;
  submittedOfflineAt: string;
}): OfflineProductionPayload {
  const { form } = params;
  const batchStartedAt = form.batchStartedAt!;
  const processCompletedAt = form.processCompletedAt!;
  let durationSeconds = form.pyrolysisDurationSeconds;

  if (durationSeconds == null) {
    const startMs = Date.parse(batchStartedAt);
    const endMs = Date.parse(processCompletedAt);
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
      durationSeconds = Math.floor((endMs - startMs) / 1000);
    }
  }

  return {
    schema_version: OFFLINE_PACKAGE_SCHEMA_VERSION,
    submission_uuid: params.submissionUuid,
    server_batch_id: params.form.batchId ?? null,
    product_id: form.productionRecordCode || null,
    batch_code: form.batchCode.trim(),
    kiln_id: form.kilnId.trim(),
    production_unit_id: form.selectedUnitId,
    farmer_id: form.selectedFarmerId!,
    farm_id: form.farmId!,
    artisan_id: params.artisanId,
    farmer_name: form.farmerName || null,
    farm_code: form.farmCode || null,
    production_date: form.productionDate || null,
    operator_name: form.operatorName || null,
    feedstock_quantity: form.feedstockQuantity.trim(),
    feedstock_unit: form.feedstockUnit,
    feedstock_type: form.feedstockType.trim(),
    feedstock_size: form.feedstockSize.trim(),
    gps_latitude: form.latitude!,
    gps_longitude: form.longitude!,
    gps_accuracy: form.accuracyM,
    altitude: form.altitude,
    village_name: form.villageName || null,
    taluka_name: form.talukaName || null,
    district_name: form.districtName || null,
    state_name: form.stateName || null,
    moisture_readings: form.moistureReadings.slice(0, 5).map((reading, index) => ({
      sequence: reading.sequence ?? index + 1,
      moistureReading: reading.moistureReading,
      notes: reading.notes,
      photo: reading.photo,
      capturedAt: reading.photo?.capturedAt ?? null,
      latitude: reading.photo?.latitude ?? null,
      longitude: reading.photo?.longitude ?? null,
      accuracy: reading.photo?.accuracy ?? null,
    })),
    batch_started_at: batchStartedAt,
    process_completed_at: processCompletedAt,
    pyrolysis_started_at: batchStartedAt,
    pyrolysis_finished_at: processCompletedAt,
    pyrolysis_duration_seconds: durationSeconds,
    quenching_started_at: form.quenchingStartedAt ?? processCompletedAt,
    temperature: form.temperature.trim(),
    residence_time: form.residenceTime.trim(),
    biochar_output: form.biocharOutput.trim(),
    biochar_output_unit: form.biocharOutputUnit,
    timestamp_date: form.timestampDate || null,
    timestamp_time: form.timestampTime || null,
    submitted_offline_at: params.submittedOfflineAt,
    evidence: form.evidence,
  };
}
