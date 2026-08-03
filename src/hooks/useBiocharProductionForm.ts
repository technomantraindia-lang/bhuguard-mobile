import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  createOfficerBiocharBatch,
  getBiocharBatchPreviewCodes,
  getBiocharProductionUnits,
  getFieldOfficerBiocharBatch,
  getFieldOfficerFarmerDetail,
  getFieldOfficerFarmers,
  getFieldOfficerProfile,
  saveFieldOfficerBiocharBatchDraft,
  submitFieldOfficerBiocharBatch,
  updateFieldOfficerBiocharBatch,
} from '../api/fieldOfficerApi';
import {
  createFarmerBiocharActivity,
  getFarmerBiocharActivity,
  getFarmerBiocharBatchPreviewCodes,
  getFarmerProfile,
  saveFarmerBiocharActivityDraft,
  submitFarmerBiocharActivity,
} from '../api/farmerApi';
import {
  createArtisanBiocharProduction,
  getArtisanBiocharBatchPreviewCodes,
  getArtisanBiocharProduction,
  getArtisanBiocharProductionUnits,
  getArtisanProfile,
  saveArtisanBiocharProductionDraft,
  submitArtisanBiocharProduction,
  uploadArtisanBiocharMoistureReading,
  uploadArtisanBiocharProcessEvidence,
} from '../api/artisanApi';
import { BIOCHAR_EVIDENCE_API_FIELD, BIOCHAR_PROCESS_MOISTURE_READING_COUNT, type BiocharEvidenceKey } from '../constants/biocharProduction';
import { DEFAULT_FEEDSTOCK_TYPE, DEFAULT_FEEDSTOCK_QUANTITY_UNIT } from '../constants/feedstockTypes';
import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import {
  isValidMoistureReadingValue,
  moistureReadingValidationError,
  MOISTURE_READING_LT20_MESSAGE,
} from '../utils/moistureReadingValidation';
import {
  currentBiocharTimeValue,
  DEFAULT_ARTISAN_KILN_ID,
  isValidArtisanKilnId,
  isValidKilnId,
  kilnIdValidationError,
  mapProductionUnit,
  normalizeAltitude,
  normalizeKilnId,
  normalizeTimeForApi,
  parseAltitudeInput,
  pickBiocharTimeValue,
  type ProductionUnitOption,
} from '../utils/biocharProductionHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { createEvidenceCaptureTimestamp } from '../utils/evidenceDateTime';
import { captureLivePhotoEvidence, liveEvidenceCameraOptions, pickStampedPhotoEvidence } from '../utils/liveEvidenceCapture';
import {
  processEndProcessCameraUri,
  stampEndProcessPending,
  type EndProcessPendingStamp,
} from '../utils/endProcessImageCapture';
import { buildGoogleMapsUrl } from '../utils/officerGpsCapture';
import {
  captureBiocharGps,
  biocharGpsAccuracyLabel,
  showBiocharPoorAccuracyWarning,
  BIOCHAR_POOR_ACCURACY_MESSAGE,
} from '../utils/biocharGpsCapture';
import type { ArtisanGpsAccuracyTier } from '../utils/artisanGpsAccuracy';
import { classifyArtisanGpsAccuracy } from '../utils/artisanGpsAccuracy';
import {
  buildBiocharProductionDraftKey,
  clearBiocharProductionDraft,
  loadBiocharProductionDraft,
  migrateBiocharProductionDraft,
  saveBiocharProductionDraft,
  type BiocharProductionLocalDraft,
} from '../storage/biocharProductionDraftStorage';
import { getAuthUser } from '../storage/authStorage';
import {
  ensureDraftUuid,
  ensurePersistedEvidenceAsset,
  isBiocharEvidenceSatisfied,
  mapRemoteBiocharEvidences,
  mapRemoteMoisturePhoto,
  mergeBiocharEvidenceMaps,
  mergeMoisturePhoto,
  shouldUploadEvidenceFile,
} from '../utils/biocharEvidenceHydration';
import { resolveBiocharEvidenceUrl } from '../utils/biocharEvidencePersistence';
import {
  validateOfflineProductionSnapshot,
  type OfflineProductionPayload,
  type OfflineSubmitFormSnapshot,
} from '../utils/offlineBiocharProductionPayload';
import { getOfflineSubmissionByUuid } from '../storage/offlineBiocharProductionDb';
import { createImmutableOfflineSubmission } from '../services/offlineBiocharProductionSubmit';
import { syncPendingBiocharProductions } from '../services/biocharProductionSyncService';
import { createSubmissionUuid } from '../utils/offlineBiocharEvidenceStorage';
import { isTransportUnreachableError } from '../utils/networkTransport';
import { safeNetInfoIsConnected } from '../utils/safeNetInfo';
import { shouldBlockOfflineTimestampSubmit, buildTimeAuditMetadata } from '../services/serverTimeSync';

export type BiocharSubmitResult =
  | string
  | {
      batchCode: string;
      submissionUuid: string;
      status: string;
      offline: boolean;
    };

const END_PROCESS_EVIDENCE_KEY: BiocharEvidenceKey = 'end_stage_before_quenching_photo';

interface UseBiocharProductionFormOptions {
  farmerId?: number;
  farmId?: number;
  batchId?: number;
  submissionUuid?: string;
  viewOnly?: boolean;
  apiMode?: 'officer' | 'farmer' | 'artisan';
  /**
   * When true, this is an explicit "Add New" session: never silently resume a
   * stale local draft for this farmer/farm (which could otherwise reopen an
   * abandoned-but-not-cleared batch, including one that was already
   * submitted). Any leftover "new" draft for this farmer/farm is discarded.
   */
  forceNewBatch?: boolean;
  selectionPrefill?: {
    farmerName?: string;
    farmerCode?: string;
    farmCode?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
    latitude?: number | null;
    longitude?: number | null;
    gpsAccuracy?: number | null;
    fieldOfficerId?: number | null;
    visitId?: number | null;
  };
}

export interface BiocharFarmerOption {
  id: number;
  name: string;
  mobile?: string;
  farmerCode?: string;
}

function mapFarmerOption(farmer: ApiRecord): BiocharFarmerOption | null {
  const id = Number(farmer.farmer_id ?? farmer.farmerId ?? farmer.id);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const name = pickString(farmer, 'name', 'farmer_name', 'farmerName');
  const farmerCode = pickString(farmer, 'farmer_code', 'farmerCode');

  return {
    id,
    name: name !== '-' ? name : `Farmer #${id}`,
    mobile: pickString(farmer, 'mobile') !== '-' ? pickString(farmer, 'mobile') : undefined,
    farmerCode: farmerCode !== '-' ? farmerCode : undefined,
  };
}

export interface BiocharMoistureReadingDraft {
  key: string;
  sequence: number;
  moistureReading: string;
  notes: string;
  photo?: BiocharEvidenceAsset;
  readingId?: number | null;
  evidenceId?: number | null;
  uploadStatus?: 'idle' | 'local_pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string | null;
}

function moistureSlotKey(sequence: number): string {
  return `moisture_${sequence}_photo`;
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === '') {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function createMoistureReadingDraft(sequence = 1): BiocharMoistureReadingDraft {
  return {
    key: moistureSlotKey(sequence),
    sequence,
    moistureReading: '',
    notes: '',
    readingId: null,
    evidenceId: null,
    uploadStatus: 'idle',
    error: null,
  };
}

function createDefaultMoistureReadings(): BiocharMoistureReadingDraft[] {
  return Array.from({ length: BIOCHAR_PROCESS_MOISTURE_READING_COUNT }, (_, index) =>
    createMoistureReadingDraft(index + 1),
  );
}

function createImmediateCapturedAsset(params: {
  uri: string;
  name: string;
  shutterEpochMs?: number;
}): BiocharEvidenceAsset {
  const timestamp = createEvidenceCaptureTimestamp({
    captureSource: 'live_camera',
    epochMilliseconds: params.shutterEpochMs,
  });

  return {
    uri: params.uri,
    localUri: params.uri,
    name: params.name,
    mimeType: 'image/jpeg',
    capturedAt: timestamp.capturedAtUtc,
    source: 'local',
    uploadStatus: 'local_pending',
    isStamped: false,
    isRequired: true,
  };
}

function normalizeMoistureReadings(readings: BiocharMoistureReadingDraft[]): BiocharMoistureReadingDraft[] {
  const bySequence = new Map<number, BiocharMoistureReadingDraft>();

  readings.forEach((reading, index) => {
    const sequence = reading.sequence || index + 1;
    if (sequence < 1 || sequence > BIOCHAR_PROCESS_MOISTURE_READING_COUNT) {
      return;
    }
    bySequence.set(sequence, {
      ...reading,
      key: moistureSlotKey(sequence),
      sequence,
      uploadStatus: reading.uploadStatus ?? (reading.photo?.evidenceId != null || reading.evidenceId != null ? 'uploaded' : reading.photo ? 'local_pending' : 'idle'),
      error: reading.error ?? null,
      readingId: nullableNumber(reading.readingId),
      evidenceId: nullableNumber(reading.evidenceId ?? reading.photo?.evidenceId),
    });
  });

  return Array.from({ length: BIOCHAR_PROCESS_MOISTURE_READING_COUNT }, (_, index) => {
    const sequence = index + 1;
    return bySequence.get(sequence) ?? createMoistureReadingDraft(sequence);
  });
}

function isMoistureReadingServerReady(reading: BiocharMoistureReadingDraft): boolean {
  return Boolean(
    isValidMoistureReadingValue(reading.moistureReading) &&
      (reading.evidenceId != null ||
        reading.readingId != null ||
        reading.uploadStatus === 'uploaded' ||
        reading.photo?.evidenceId != null ||
        (reading.photo?.source === 'remote' && reading.photo.remoteUrl)),
  );
}

function appendTimeField(formData: FormData, field: string, value: string): void {
  const normalized = normalizeTimeForApi(value);

  if (normalized) {
    formData.append(field, normalized);
  }
}

function validateTimeFields(values: Record<string, string>): string | null {
  for (const [label, value] of Object.entries(values)) {
    const trimmed = value.trim();

    if (!trimmed || trimmed === '-') {
      continue;
    }

    if (!normalizeTimeForApi(trimmed)) {
      return `${label} must use 24-hour HH:MM format (example: 14:30).`;
    }
  }

  return null;
}

function currentTimeValue(): string {
  return currentBiocharTimeValue();
}

function hydrateBatch(batch: ApiRecord) {
  const kilnId = pickString(batch, 'kiln_id', 'kilnId');
  const farmerName = pickString(batch, 'farmer_name', 'farmerName');
  const moistureReadings = extractList(batch, ['moisture_readings']).map((reading, index) => {
    const sequence =
      reading.sequence_number != null
        ? Number(reading.sequence_number)
        : reading.sequence != null
          ? Number(reading.sequence)
          : index + 1;
    const key = moistureSlotKey(sequence);
    const photo = mapRemoteMoisturePhoto(reading, key);
    const evidenceId =
      reading.evidence_id != null
        ? Number(reading.evidence_id)
        : photo?.evidenceId != null
          ? Number(photo.evidenceId)
          : null;

    return {
      key,
      sequence,
      moistureReading: pickString(reading, 'moisture_reading', 'moistureReading', 'value'),
      notes: pickString(reading, 'notes') !== '-' ? pickString(reading, 'notes') : '',
      photo,
      readingId: reading.id != null ? Number(reading.id) : null,
      evidenceId,
      uploadStatus: photo || evidenceId != null ? ('uploaded' as const) : ('idle' as const),
      error: null,
    };
  });

  return {
    batchId: Number(batch.id),
    productionRecordCode: pickString(batch, 'production_record_code', 'productionRecordCode'),
    batchCode: pickString(batch, 'batch_code', 'batchCode'),
    selectedFarmerId: batch.farmer_id != null ? Number(batch.farmer_id) : null,
    farmId: batch.farm_id != null ? Number(batch.farm_id) : null,
    farmCode: pickString(batch, 'farm_code', 'farmCode') !== '-' ? pickString(batch, 'farm_code', 'farmCode') : '',
    selectedUnitId: batch.production_unit_id != null ? Number(batch.production_unit_id) : null,
    kilnId: kilnId !== '-' ? kilnId : '',
    farmerName: farmerName !== '-' ? farmerName : '',
    productionDate:
      pickString(batch, 'production_date', 'productionDate') !== '-'
        ? pickString(batch, 'production_date', 'productionDate').slice(0, 10)
        : todayIsoDate(),
    operatorName: pickString(batch, 'operator_name', 'operatorName'),
    feedstockQuantity: batch.feedstock_quantity != null ? String(batch.feedstock_quantity) : '',
    feedstockUnit: pickString(batch, 'feedstock_unit', 'feedstockUnit') || DEFAULT_FEEDSTOCK_QUANTITY_UNIT,
    feedstockType: pickString(batch, 'feedstock_type', 'feedstockType') || DEFAULT_FEEDSTOCK_TYPE,
    feedstockSize:
      pickString(batch, 'feedstock_size', 'feedstockSize', 'feedstock_item_details', 'feedstockItemDetails') !== '-'
        ? pickString(batch, 'feedstock_size', 'feedstockSize', 'feedstock_item_details', 'feedstockItemDetails')
        : '',
    moistureValue: batch.moisture_value != null ? String(batch.moisture_value) : '',
    startTime: pickBiocharTimeValue(batch, 'start_time', 'startTime') || '08:00',
    endTime: pickBiocharTimeValue(batch, 'end_time', 'endTime') || '12:30',
    temperature: batch.temperature != null ? String(batch.temperature) : '',
    residenceTime: pickString(batch, 'residence_time', 'residenceTime'),
    biocharOutput: batch.biochar_output != null ? String(batch.biochar_output) : '',
    biocharOutputUnit: (pickString(batch, 'biochar_output_unit', 'biocharOutputUnit') || 'kg') as 'kg' | 'ton',
    latitude: batch.gps_latitude != null ? Number(batch.gps_latitude) : batch.latitude != null ? Number(batch.latitude) : null,
    longitude: batch.gps_longitude != null ? Number(batch.gps_longitude) : batch.longitude != null ? Number(batch.longitude) : null,
    accuracyM: batch.gps_accuracy != null ? Number(batch.gps_accuracy) : null,
    altitude: normalizeAltitude(batch.altitude != null ? Number(batch.altitude) : null),
    timestampDate:
      pickString(batch, 'timestamp_date', 'timestampDate') !== '-'
        ? pickString(batch, 'timestamp_date', 'timestampDate').slice(0, 10)
        : todayIsoDate(),
    timestampTime: pickBiocharTimeValue(batch, 'timestamp_time', 'timestampTime') || currentTimeValue(),
    finalStageTime: pickBiocharTimeValue(batch, 'final_stage_time', 'finalStageTime'),
    quenchingTime: pickBiocharTimeValue(batch, 'quenching_time', 'quenchingTime') || currentTimeValue(),
    pyrolysisStartedAt:
      pickString(batch, 'batch_started_at', 'batchStartedAt') !== '-'
        ? pickString(batch, 'batch_started_at', 'batchStartedAt')
        : pickString(batch, 'pyrolysis_started_at', 'pyrolysisStartedAt') !== '-'
          ? pickString(batch, 'pyrolysis_started_at', 'pyrolysisStartedAt')
          : null,
    pyrolysisFinishedAt:
      pickString(batch, 'process_completed_at', 'processCompletedAt') !== '-'
        ? pickString(batch, 'process_completed_at', 'processCompletedAt')
        : pickString(batch, 'pyrolysis_finished_at', 'pyrolysisFinishedAt') !== '-'
          ? pickString(batch, 'pyrolysis_finished_at', 'pyrolysisFinishedAt')
          : null,
    batchStartedAt:
      pickString(batch, 'batch_started_at', 'batchStartedAt') !== '-'
        ? pickString(batch, 'batch_started_at', 'batchStartedAt')
        : pickString(batch, 'pyrolysis_started_at', 'pyrolysisStartedAt') !== '-'
          ? pickString(batch, 'pyrolysis_started_at', 'pyrolysisStartedAt')
          : null,
    processCompletedAt:
      pickString(batch, 'process_completed_at', 'processCompletedAt') !== '-'
        ? pickString(batch, 'process_completed_at', 'processCompletedAt')
        : pickString(batch, 'pyrolysis_finished_at', 'pyrolysisFinishedAt') !== '-'
          ? pickString(batch, 'pyrolysis_finished_at', 'pyrolysisFinishedAt')
          : null,
    pyrolysisDurationSeconds:
      batch.pyrolysis_duration_seconds != null ? Number(batch.pyrolysis_duration_seconds) : null,
    pyrolysisDurationLabel:
      pickString(batch, 'pyrolysis_duration_label', 'pyrolysisDurationLabel', 'duration_label', 'durationLabel') !== '-'
        ? pickString(batch, 'pyrolysis_duration_label', 'pyrolysisDurationLabel', 'duration_label', 'durationLabel')
        : null,
    quenchingStartedAt:
      pickString(batch, 'quenching_started_at', 'quenchingStartedAt') !== '-'
        ? pickString(batch, 'quenching_started_at', 'quenchingStartedAt')
        : null,
    villageName: pickString(batch, 'village_name', 'villageName'),
    talukaName: pickString(batch, 'taluka_name', 'talukaName'),
    districtName: pickString(batch, 'district_name', 'districtName'),
    stateName: pickString(batch, 'state_name', 'stateName'),
    officerNotes: pickString(batch, 'officer_notes', 'officerNotes'),
    moistureReadings,
    evidence: mapRemoteBiocharEvidences(batch),
    canEdit: batch.can_edit !== false,
    canSubmit: batch.can_submit !== false,
    status: pickString(batch, 'status'),
  };
}

export function useBiocharProductionForm({
  farmerId,
  farmId,
  batchId: initialBatchId,
  submissionUuid: initialSubmissionUuid,
  viewOnly = false,
  apiMode = 'officer',
  selectionPrefill,
  forceNewBatch = false,
}: UseBiocharProductionFormOptions = {}) {
  const isFarmerMode = apiMode === 'farmer';
  const isArtisanMode = apiMode === 'artisan';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState('Field Officer');
  const [batchId, setBatchId] = useState<number | null>(initialBatchId ?? null);
  const pendingFarmerCreateRef = useRef<Promise<number> | null>(null);
  const isCapturingEndProcessRef = useRef(false);
  const endProcessPendingRef = useRef<EndProcessPendingStamp | null>(null);
  const [endProcessProcessing, setEndProcessProcessing] = useState(false);
  const [endProcessProcessError, setEndProcessProcessError] = useState<string | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(farmerId ?? null);
  const [resolvedFarmId, setResolvedFarmId] = useState<number | null>(farmId ?? null);
  const [resolvedFarmCode, setResolvedFarmCode] = useState<string>(selectionPrefill?.farmCode ?? '');
  const [canEdit, setCanEdit] = useState(true);
  const [canSubmit, setCanSubmit] = useState(true);

  const [productionRecordCode, setProductionRecordCode] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [batchCodeError, setBatchCodeError] = useState<string | null>(null);
  const [units, setUnits] = useState<ProductionUnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [kilnId, setKilnId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [productionDate, setProductionDate] = useState(todayIsoDate());
  const [operatorName, setOperatorName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [gpsAccuracyTier, setGpsAccuracyTier] = useState<ArtisanGpsAccuracyTier>('unknown');
  const [gpsCapturedAt, setGpsCapturedAt] = useState<string | null>(null);
  const [gpsCaptureError, setGpsCaptureError] = useState<string | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [timestampDate, setTimestampDate] = useState(todayIsoDate());
  const [timestampTime, setTimestampTime] = useState(currentTimeValue());
  const [finalStageTime, setFinalStageTime] = useState('');
  const [quenchingTime, setQuenchingTime] = useState(currentTimeValue());
  const [villageName, setVillageName] = useState('');
  const [talukaName, setTalukaName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [stateName, setStateName] = useState('');

  const [feedstockQuantity, setFeedstockQuantity] = useState('');
  const [feedstockUnit, setFeedstockUnit] = useState(DEFAULT_FEEDSTOCK_QUANTITY_UNIT);
  const [feedstockType, setFeedstockType] = useState(DEFAULT_FEEDSTOCK_TYPE);
  const [feedstockSize, setFeedstockSize] = useState('');
  const [moistureValue, setMoistureValue] = useState('');
  const [pyrolysisStartedAt, setPyrolysisStartedAt] = useState<string | null>(null);
  const [pyrolysisFinishedAt, setPyrolysisFinishedAt] = useState<string | null>(null);
  const [batchStartedAt, setBatchStartedAt] = useState<string | null>(null);
  const [processCompletedAt, setProcessCompletedAt] = useState<string | null>(null);
  const [pyrolysisDurationSeconds, setPyrolysisDurationSeconds] = useState<number | null>(null);
  const [pyrolysisDurationLabel, setPyrolysisDurationLabel] = useState<string | null>(null);
  const [quenchingStartedAt, setQuenchingStartedAt] = useState<string | null>(null);
  const [moistureReadings, setMoistureReadings] = useState<BiocharMoistureReadingDraft[]>(createDefaultMoistureReadings);
  const [moistureSaving, setMoistureSaving] = useState(false);
  const [moistureStepError, setMoistureStepError] = useState<string | null>(null);
  const [moistureServerConfirmed, setMoistureServerConfirmed] = useState(false);
  const moistureSyncLockRef = useRef(false);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:30');
  const [temperature, setTemperature] = useState('');
  const [residenceTime, setResidenceTime] = useState('');
  const [biocharOutput, setBiocharOutput] = useState('');
  const [biocharOutputUnit, setBiocharOutputUnit] = useState<'kg' | 'ton'>('kg');
  const [officerNotes, setOfficerNotes] = useState('');
  const [recordStatus, setRecordStatus] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>>({});
  const [farmers, setFarmers] = useState<BiocharFarmerOption[]>([]);
  const [farmerCode, setFarmerCode] = useState<string | null>(null);
  const [draftUuid, setDraftUuid] = useState(() => ensureDraftUuid());
  const [authUserId, setAuthUserId] = useState<number | null>(null);
  const skipDraftSaveRef = useRef(false);
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteEvidenceRef = useRef<Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>>({});
  const remoteMoistureRef = useRef<BiocharMoistureReadingDraft[]>([]);
  const hydrationPassRef = useRef<string | null>(null);
  const initialLoadSessionRef = useRef<string | null>(null);
  const evidenceRef = useRef(evidence);
  const moistureReadingsRef = useRef(moistureReadings);
  const buildLocalDraftRef = useRef<() => BiocharProductionLocalDraft>(() => {
    throw new Error('buildLocalDraft not ready');
  });
  const moistureCaptureLockRef = useRef(false);

  useEffect(() => {
    evidenceRef.current = evidence;
  }, [evidence]);

  useEffect(() => {
    moistureReadingsRef.current = moistureReadings;
  }, [moistureReadings]);

  const draftStorageKey = useMemo(
    () =>
      buildBiocharProductionDraftKey({
        apiMode,
        userId: authUserId,
        farmerId,
        farmId,
        batchId: initialBatchId ?? batchId,
      }),
    [apiMode, authUserId, batchId, farmId, farmerId, initialBatchId],
  );

  const newDraftStorageKey = useMemo(
    () =>
      buildBiocharProductionDraftKey({
        apiMode,
        userId: authUserId,
        farmerId,
        farmId,
        batchId: null,
      }),
    [apiMode, authUserId, farmId, farmerId],
  );

  useEffect(() => {
    if (farmerId != null && farmerId > 0) {
      setSelectedFarmerId(farmerId);
    }
  }, [farmerId]);

  const statusLabel = useMemo(() => {
    if (recordStatus === 'draft') {
      return 'Draft';
    }

    if (recordStatus === 'pending_sync' || recordStatus === 'syncing') {
      return 'Pending Sync';
    }

    if (recordStatus === 'sync_failed') {
      return 'Sync Failed';
    }

    if (recordStatus === 'submitted_for_review') {
      return 'Submitted';
    }

    if (recordStatus === 'completed' || recordStatus === 'approved') {
      return 'Completed';
    }

    if (recordStatus === 'correction_required') {
      return 'Correction Required';
    }

    return recordStatus ? recordStatus.replace(/_/g, ' ') : null;
  }, [recordStatus]);

  const applyOfflinePayload = useCallback(async (payload: OfflineProductionPayload, status: string) => {
    setBatchId(payload.server_batch_id);
    setProductionRecordCode(payload.product_id ?? '');
    setBatchCode(payload.batch_code);
    setSelectedFarmerId(payload.farmer_id);
    setResolvedFarmId(payload.farm_id);
    setResolvedFarmCode(payload.farm_code ?? '');
    setSelectedUnitId(payload.production_unit_id);
    setKilnId(payload.kiln_id);
    setFarmerName(payload.farmer_name ?? '');
    setProductionDate(payload.production_date?.slice(0, 10) || todayIsoDate());
    setOperatorName(payload.operator_name ?? '');
    setFeedstockQuantity(payload.feedstock_quantity);
    setFeedstockUnit(payload.feedstock_unit as typeof feedstockUnit);
    setFeedstockType(payload.feedstock_type as typeof feedstockType);
    setFeedstockSize(payload.feedstock_size);
    setLatitude(payload.gps_latitude);
    setLongitude(payload.gps_longitude);
    setAccuracyM(payload.gps_accuracy);
    setGpsAccuracyTier(
      payload.gps_accuracy != null ? classifyArtisanGpsAccuracy(payload.gps_accuracy) : 'unknown',
    );
    setAltitude(normalizeAltitude(payload.altitude));
    setTimestampDate(payload.timestamp_date?.slice(0, 10) || todayIsoDate());
    setTimestampTime(payload.timestamp_time || currentBiocharTimeValue());
    setVillageName(payload.village_name ?? '');
    setTalukaName(payload.taluka_name ?? '');
    setDistrictName(payload.district_name ?? '');
    setStateName(payload.state_name ?? '');
    setTemperature(payload.temperature);
    setResidenceTime(payload.residence_time);
    setBiocharOutput(payload.biochar_output);
    setBiocharOutputUnit((payload.biochar_output_unit || 'kg') as 'kg' | 'ton');
    setPyrolysisStartedAt(payload.batch_started_at ?? payload.pyrolysis_started_at);
    setPyrolysisFinishedAt(payload.process_completed_at ?? payload.pyrolysis_finished_at);
    setBatchStartedAt(payload.batch_started_at ?? payload.pyrolysis_started_at);
    setProcessCompletedAt(payload.process_completed_at ?? payload.pyrolysis_finished_at);
    setPyrolysisDurationSeconds(payload.pyrolysis_duration_seconds);
    if (payload.pyrolysis_duration_seconds != null) {
      const seconds = payload.pyrolysis_duration_seconds;
      setPyrolysisDurationLabel(
        `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`,
      );
    } else {
      setPyrolysisDurationLabel(null);
    }
    setQuenchingStartedAt(payload.quenching_started_at);
    setEvidence(payload.evidence ?? {});
    setMoistureReadings(
      normalizeMoistureReadings(
        payload.moisture_readings.map((reading, index) => ({
          key: moistureSlotKey(reading.sequence ?? index + 1),
          sequence: reading.sequence ?? index + 1,
          moistureReading: reading.moistureReading,
          notes: reading.notes,
          photo: reading.photo ?? undefined,
          readingId: nullableNumber(reading.readingId),
          evidenceId: nullableNumber(reading.evidenceId ?? reading.photo?.evidenceId),
          uploadStatus: reading.uploadStatus ?? (reading.photo?.evidenceId != null ? 'uploaded' : reading.photo ? 'local_pending' : 'idle'),
          error: reading.error ?? null,
        })),
      ),
    );
    setRecordStatus(status);
    setCanEdit(false);
    setCanSubmit(false);
  }, []);

  const applyBatch = useCallback((batch: ApiRecord) => {
    const hydrated = hydrateBatch(batch);
    setBatchId(hydrated.batchId);
    setProductionRecordCode(hydrated.productionRecordCode !== '-' ? hydrated.productionRecordCode : '');
    setBatchCode(hydrated.batchCode !== '-' ? hydrated.batchCode : '');
    if (hydrated.selectedFarmerId != null) {
      setSelectedFarmerId(hydrated.selectedFarmerId);
    }
    if (hydrated.farmId != null && hydrated.farmId > 0) {
      setResolvedFarmId(hydrated.farmId);
    }
    if (hydrated.farmCode) {
      setResolvedFarmCode(hydrated.farmCode);
    }
    if (hydrated.selectedUnitId) {
      setSelectedUnitId(hydrated.selectedUnitId);
    }
    if (hydrated.kilnId) {
      setKilnId(hydrated.kilnId);
    }
    if (hydrated.farmerName) {
      setFarmerName(hydrated.farmerName);
    }
    if (hydrated.productionDate) {
      setProductionDate(hydrated.productionDate);
    }
    if (hydrated.operatorName !== '-') {
      setOperatorName(hydrated.operatorName);
    }
    setFeedstockQuantity(hydrated.feedstockQuantity);
    setFeedstockUnit(hydrated.feedstockUnit as typeof feedstockUnit);
    setFeedstockType(hydrated.feedstockType as typeof feedstockType);
    setFeedstockSize(hydrated.feedstockSize || '');
    setMoistureValue(hydrated.moistureValue);
    setStartTime(hydrated.startTime);
    setEndTime(hydrated.endTime);
    setTemperature(hydrated.temperature);
    setResidenceTime(hydrated.residenceTime !== '-' ? hydrated.residenceTime : '');
    setBiocharOutput(hydrated.biocharOutput);
    setBiocharOutputUnit(hydrated.biocharOutputUnit);
    setLatitude(hydrated.latitude);
    setLongitude(hydrated.longitude);
    setAccuracyM(hydrated.accuracyM);
    setGpsAccuracyTier(
      hydrated.accuracyM != null ? classifyArtisanGpsAccuracy(hydrated.accuracyM) : 'unknown',
    );
    setAltitude(hydrated.altitude);
    setTimestampDate(hydrated.timestampDate);
    setTimestampTime(hydrated.timestampTime);
    setFinalStageTime(hydrated.finalStageTime);
    setQuenchingTime(hydrated.quenchingTime);
    if (hydrated.pyrolysisStartedAt) {
      setPyrolysisStartedAt(hydrated.pyrolysisStartedAt);
    }
    if (hydrated.pyrolysisFinishedAt) {
      setPyrolysisFinishedAt(hydrated.pyrolysisFinishedAt);
    }
    // Batch Start / Completion Time are captured exactly once on-device and are immutable
    // afterwards. A freshly-created batch has no server value yet — never let that null
    // response wipe out a value the officer/artisan already captured this session
    // (this previously forced a duplicate re-capture right after session creation).
    if (hydrated.batchStartedAt) {
      setBatchStartedAt(hydrated.batchStartedAt);
    }
    if (hydrated.processCompletedAt) {
      setProcessCompletedAt(hydrated.processCompletedAt);
    }
    setPyrolysisDurationSeconds(hydrated.pyrolysisDurationSeconds);
    setPyrolysisDurationLabel(hydrated.pyrolysisDurationLabel);
    setQuenchingStartedAt(hydrated.quenchingStartedAt);
    setVillageName(hydrated.villageName !== '-' ? hydrated.villageName : '');
    setTalukaName(hydrated.talukaName !== '-' ? hydrated.talukaName : '');
    setDistrictName(hydrated.districtName !== '-' ? hydrated.districtName : '');
    setStateName(hydrated.stateName !== '-' ? hydrated.stateName : '');
    const nextMoisture = normalizeMoistureReadings(
      hydrated.moistureReadings.length > 0 ? hydrated.moistureReadings : createDefaultMoistureReadings(),
    );
    remoteMoistureRef.current = nextMoisture;
    setMoistureReadings((current) => {
      if (hydrated.moistureReadings.length === 0) {
        return current;
      }

      return nextMoisture.map((remoteReading, index) => {
        const previous =
          current.find((item) => item.sequence === remoteReading.sequence) ??
          current.find((item) => item.key === remoteReading.key) ??
          current[index];
        const preferLocalPhoto =
          Boolean(previous?.photo?.localUri) ||
          Boolean(previous?.photo?.uri && !previous.photo.uri.startsWith('http'));

        return {
          ...remoteReading,
          key: moistureSlotKey(remoteReading.sequence),
          sequence: remoteReading.sequence,
          moistureReading: remoteReading.moistureReading || previous?.moistureReading || '',
          notes: remoteReading.notes || previous?.notes || '',
          photo: preferLocalPhoto && previous?.photo ? previous.photo : remoteReading.photo ?? previous?.photo,
          readingId: nullableNumber(remoteReading.readingId ?? previous?.readingId),
          evidenceId: nullableNumber(remoteReading.evidenceId ?? previous?.evidenceId ?? previous?.photo?.evidenceId),
          uploadStatus:
            remoteReading.uploadStatus === 'uploaded' || remoteReading.evidenceId != null || remoteReading.readingId != null
              ? 'uploaded'
              : previous?.uploadStatus === 'failed'
                ? 'failed'
                : previous?.uploadStatus ?? remoteReading.uploadStatus ?? 'idle',
          error: previous?.uploadStatus === 'failed' ? previous.error ?? null : null,
        };
      });
    });
    const serverReadyCount = nextMoisture.filter(isMoistureReadingServerReady).length;
    if (serverReadyCount >= BIOCHAR_PROCESS_MOISTURE_READING_COUNT) {
      setMoistureServerConfirmed(true);
      setMoistureStepError(null);
    }
    setOfficerNotes(hydrated.officerNotes !== '-' ? hydrated.officerNotes : '');
    remoteEvidenceRef.current = { ...remoteEvidenceRef.current, ...hydrated.evidence };
    setEvidence((current) => {
      const next: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>> = {
        ...current,
        ...hydrated.evidence,
      };

      (['biochar_unloaded_photo', 'biochar_mixing_photo'] as BiocharEvidenceKey[]).forEach((key) => {
        if (hydrated.evidence[key]) {
          return;
        }

        const existing = next[key];
        if (
          existing &&
          existing.evidenceId == null &&
          !existing.localUri &&
          (existing.source === 'remote' || Boolean(existing.remoteUrl))
        ) {
          delete next[key];
        }
      });

      return next;
    });
    setCanEdit(hydrated.canEdit);
    setCanSubmit(hydrated.canSubmit);
    setRecordStatus(hydrated.status !== '-' ? hydrated.status : null);
  }, []);

  const applyLocalDraft = useCallback(async (draft: BiocharProductionLocalDraft) => {
    if (draft.draftUuid) {
      setDraftUuid(draft.draftUuid);
    }
    if (draft.batchId) {
      setBatchId(draft.batchId);
    }
    setProductionRecordCode(draft.productionRecordCode);
    setBatchCode(draft.batchCode);
    if (draft.selectedFarmerId != null) {
      // Never let a stale local draft override the farmer selected in navigation.
      if (farmerId == null || farmerId <= 0 || draft.selectedFarmerId === farmerId) {
        setSelectedFarmerId(draft.selectedFarmerId);
      }
    }
    if (draft.selectedUnitId) {
      setSelectedUnitId(draft.selectedUnitId);
    }
    setKilnId(draft.kilnId);
    if (farmerId == null || farmerId <= 0 || draft.selectedFarmerId == null || draft.selectedFarmerId === farmerId) {
      setFarmerName(draft.farmerName);
    }
    setProductionDate(draft.productionDate);
    setOperatorName(draft.operatorName);
    setFeedstockQuantity(draft.feedstockQuantity);
    setFeedstockUnit(draft.feedstockUnit as typeof feedstockUnit);
    setFeedstockType(draft.feedstockType as typeof feedstockType);
    setMoistureValue(draft.moistureValue);
    setStartTime(draft.startTime);
    setEndTime(draft.endTime);
    setTemperature(draft.temperature);
    setResidenceTime(draft.residenceTime);
    setBiocharOutput(draft.biocharOutput);
    setBiocharOutputUnit(draft.biocharOutputUnit);
    setLatitude(draft.latitude);
    setLongitude(draft.longitude);
    setAccuracyM(draft.accuracyM);
    setGpsAccuracyTier(
      draft.accuracyM != null ? classifyArtisanGpsAccuracy(draft.accuracyM) : 'unknown',
    );
    setGpsCapturedAt(draft.gpsCapturedAt);
    setAltitude(normalizeAltitude(draft.altitude));
    setTimestampDate(draft.timestampDate);
    setTimestampTime(normalizeTimeForApi(draft.timestampTime) ?? draft.timestampTime);
    setFinalStageTime(normalizeTimeForApi(draft.finalStageTime) ?? draft.finalStageTime);
    setQuenchingTime(normalizeTimeForApi(draft.quenchingTime) ?? draft.quenchingTime);
    setVillageName(draft.villageName);
    setTalukaName(draft.talukaName);
    setDistrictName(draft.districtName);
    setStateName(draft.stateName);
    setOfficerNotes(draft.officerNotes);
    // Capture-once fields: restore from draft so resuming never re-prompts for a new value.
    if (draft.batchStartedAt) {
      setBatchStartedAt((current) => current ?? draft.batchStartedAt ?? null);
    }
    if (draft.processCompletedAt) {
      setProcessCompletedAt((current) => current ?? draft.processCompletedAt ?? null);
    }

    const mergedEvidence = await mergeBiocharEvidenceMaps(remoteEvidenceRef.current, draft.evidence);
    setEvidence(mergedEvidence);

    const localHasMoistureContent = draft.moistureReadings.some(
      (reading) => reading.moistureReading.trim() || reading.notes.trim() || reading.photo,
    );

    if (!localHasMoistureContent && remoteMoistureRef.current.some((reading) => reading.photo || reading.moistureReading)) {
      setMoistureReadings(normalizeMoistureReadings(remoteMoistureRef.current));
      return;
    }

    const mergedReadings = await Promise.all(
      normalizeMoistureReadings(
        draft.moistureReadings.map((reading, index) => ({
          ...reading,
          key: reading.key || moistureSlotKey(reading.sequence ?? index + 1),
          sequence: reading.sequence ?? index + 1,
          readingId: nullableNumber(reading.readingId),
          evidenceId: nullableNumber(reading.evidenceId ?? reading.photo?.evidenceId),
        })),
      ).map(async (localReading, index) => {
        const remoteReading =
          remoteMoistureRef.current.find((item) => item.sequence === localReading.sequence) ??
          remoteMoistureRef.current.find((item) => item.key === localReading.key) ??
          remoteMoistureRef.current[index];

        return {
          key: moistureSlotKey(localReading.sequence),
          sequence: localReading.sequence,
          moistureReading: localReading.moistureReading || remoteReading?.moistureReading || '',
          notes: localReading.notes || remoteReading?.notes || '',
          photo: await mergeMoisturePhoto(remoteReading?.photo, localReading.photo),
          readingId: nullableNumber(localReading.readingId ?? remoteReading?.readingId),
          evidenceId: nullableNumber(localReading.evidenceId ?? remoteReading?.evidenceId),
          uploadStatus:
            localReading.uploadStatus === 'uploaded' ||
            localReading.evidenceId != null ||
            remoteReading?.uploadStatus === 'uploaded'
              ? ('uploaded' as const)
              : localReading.uploadStatus ?? (localReading.photo ? ('local_pending' as const) : ('idle' as const)),
          error: localReading.error ?? null,
        };
      }),
    );
    setMoistureReadings(mergedReadings);
    if (mergedReadings.every(isMoistureReadingServerReady)) {
      setMoistureServerConfirmed(true);
    }
  }, [farmerId]);

  const buildLocalDraft = useCallback((): BiocharProductionLocalDraft => {
    return {
      savedAt: new Date().toISOString(),
      draftUuid,
      userId: authUserId,
      batchId,
      productionRecordCode,
      batchCode,
      selectedFarmerId,
      selectedUnitId,
      kilnId,
      farmerName,
      productionDate,
      operatorName,
      latitude,
      longitude,
      accuracyM,
      gpsCapturedAt,
      altitude: normalizeAltitude(altitude),
      timestampDate,
      timestampTime: normalizeTimeForApi(timestampTime) ?? '',
      finalStageTime: normalizeTimeForApi(finalStageTime) ?? '',
      quenchingTime: normalizeTimeForApi(quenchingTime) ?? '',
      villageName,
      talukaName,
      districtName,
      stateName,
      farmId: resolvedFarmId ?? farmId ?? null,
      feedstockQuantity,
      feedstockUnit,
      feedstockType,
      moistureValue,
      moistureReadings,
      startTime: normalizeTimeForApi(startTime) ?? '',
      endTime: normalizeTimeForApi(endTime) ?? '',
      temperature,
      residenceTime,
      biocharOutput,
      biocharOutputUnit,
      officerNotes,
      evidence,
      batchStartedAt,
      processCompletedAt,
    };
  }, [
    accuracyM,
    altitude,
    authUserId,
    batchCode,
    batchId,
    batchStartedAt,
    draftUuid,
    biocharOutput,
    biocharOutputUnit,
    districtName,
    endTime,
    evidence,
    farmerName,
    farmId,
    feedstockQuantity,
    feedstockType,
    feedstockUnit,
    finalStageTime,
    gpsCapturedAt,
    kilnId,
    latitude,
    longitude,
    moistureReadings,
    moistureValue,
    officerNotes,
    operatorName,
    processCompletedAt,
    productionDate,
    productionRecordCode,
    quenchingTime,
    residenceTime,
    resolvedFarmId,
    selectedFarmerId,
    selectedUnitId,
    startTime,
    stateName,
    talukaName,
    temperature,
    timestampDate,
    timestampTime,
    villageName,
  ]);

  buildLocalDraftRef.current = buildLocalDraft;

  const persistDraftWithLatestMedia = useCallback(
    async (patch?: {
      evidence?: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>;
      moistureReadings?: BiocharMoistureReadingDraft[];
    }) => {
      const base = buildLocalDraftRef.current();
      await saveBiocharProductionDraft(draftStorageKey, {
        ...base,
        evidence: patch?.evidence ?? { ...evidenceRef.current },
        moistureReadings: normalizeMoistureReadings(
          patch?.moistureReadings ?? moistureReadingsRef.current,
        ),
      });
      // Keep the "new" draft key warm until migrate runs after batch create.
      if (!initialBatchId && draftStorageKey !== newDraftStorageKey) {
        await saveBiocharProductionDraft(newDraftStorageKey, {
          ...base,
          evidence: patch?.evidence ?? { ...evidenceRef.current },
          moistureReadings: normalizeMoistureReadings(
            patch?.moistureReadings ?? moistureReadingsRef.current,
          ),
        });
      }
    },
    [draftStorageKey, initialBatchId, newDraftStorageKey],
  );

  const restoreLocalDraft = useCallback(async (resolvedUserId?: number | null) => {
    const userId = resolvedUserId ?? authUserId;
    // Use initialBatchId only so creating a batch mid-session does not re-hydrate and wipe captures.
    const storageKey = buildBiocharProductionDraftKey({
      apiMode,
      userId,
      farmerId,
      farmId,
      batchId: initialBatchId ?? null,
    });
    const newKey = buildBiocharProductionDraftKey({
      apiMode,
      userId,
      farmerId,
      farmId,
      batchId: null,
    });
    const passKey = `${storageKey}:${initialBatchId ?? 'new'}`;

    if (hydrationPassRef.current === passKey) {
      return;
    }

    skipDraftSaveRef.current = true;

    try {
      const draft =
        (await loadBiocharProductionDraft(storageKey)) ??
        (!initialBatchId ? await loadBiocharProductionDraft(newKey) : null);

      if (!draft) {
        hydrationPassRef.current = passKey;
        return;
      }

      if (draft.userId != null && userId != null && draft.userId !== userId) {
        hydrationPassRef.current = passKey;
        return;
      }

      await applyLocalDraft(draft);
      hydrationPassRef.current = passKey;
    } finally {
      skipDraftSaveRef.current = false;
    }
  }, [apiMode, applyLocalDraft, authUserId, farmId, farmerId, initialBatchId]);

  const clearLocalDraft = useCallback(async () => {
    await Promise.all([
      clearBiocharProductionDraft(draftStorageKey),
      clearBiocharProductionDraft(newDraftStorageKey),
    ]);
  }, [draftStorageKey, newDraftStorageKey]);

  const applySelectionPrefill = useCallback(() => {
    if (!selectionPrefill || initialBatchId) {
      return;
    }

    if (selectionPrefill.farmerName) {
      setFarmerName(selectionPrefill.farmerName);
    }
    if (selectionPrefill.village) {
      setVillageName(selectionPrefill.village);
    }
    if (selectionPrefill.taluka) {
      setTalukaName(selectionPrefill.taluka);
    }
    if (selectionPrefill.district) {
      setDistrictName(selectionPrefill.district);
    }
    if (selectionPrefill.state) {
      setStateName(selectionPrefill.state);
    }
    if (selectionPrefill.latitude != null) {
      setLatitude(selectionPrefill.latitude);
    }
    if (selectionPrefill.longitude != null) {
      setLongitude(selectionPrefill.longitude);
    }
    if (selectionPrefill.gpsAccuracy != null) {
      setAccuracyM(selectionPrefill.gpsAccuracy);
    }
  }, [
    initialBatchId,
    selectionPrefill?.district,
    selectionPrefill?.farmerName,
    selectionPrefill?.gpsAccuracy,
    selectionPrefill?.latitude,
    selectionPrefill?.longitude,
    selectionPrefill?.state,
    selectionPrefill?.taluka,
    selectionPrefill?.village,
  ]);

  const loadInitialData = useCallback(async () => {
    const sessionKey = `${apiMode}:${farmerId ?? 0}:${farmId ?? 0}:${initialBatchId ?? 'new'}:${initialSubmissionUuid ?? ''}`;
    if (initialLoadSessionRef.current === sessionKey) {
      // Prevent remount/loading flash when batchId is created mid-session or authUserId updates.
      return;
    }
    initialLoadSessionRef.current = sessionKey;

    setLoading(true);
    setError(null);
    hydrationPassRef.current = null;

    let resolvedUserId: number | null = authUserId;

    try {
      const authUser = await getAuthUser();
      if (authUser?.id) {
        resolvedUserId = Number(authUser.id);
        setAuthUserId(resolvedUserId);
      }

      if (isArtisanMode) {
        if (initialSubmissionUuid) {
          const offline = await getOfflineSubmissionByUuid(initialSubmissionUuid);
          if (offline?.payload_json) {
            const payload = JSON.parse(offline.payload_json) as OfflineProductionPayload;
            await applyOfflinePayload(payload, offline.status || 'pending_sync');
          }
        }

        const requests: Promise<unknown>[] = [getArtisanProfile(), getArtisanBiocharProductionUnits()];

        if (initialBatchId) {
          requests.push(getArtisanBiocharProduction(initialBatchId));
        }

        const results = await Promise.all(requests);
        const profileData = results[0] as ApiRecord;
        const unitsData = results[1] as ApiRecord;
        const artisan = (profileData.artisan ?? profileData) as ApiRecord;
        const name = pickString(artisan, 'name');

        if (name !== '-') {
          setOfficerName(name);
          setOperatorName((current) => current || name);
        }

        const mappedUnits = extractList(unitsData as ApiRecord, ['production_units']).map(mapProductionUnit);
        setUnits(mappedUnits);

        if (initialBatchId && results[2]) {
          const batchData = results[2] as ApiRecord;
          const batch = (batchData.batch ?? batchData.record ?? batchData) as ApiRecord;
          applyBatch(batch);
        } else if (!initialSubmissionUuid) {
          applySelectionPrefill();
          setKilnId((current) => current || DEFAULT_ARTISAN_KILN_ID);
        }

        if (viewOnly || initialSubmissionUuid) {
          setCanEdit(false);
          setCanSubmit(false);
        }

        setLoading(false);
        return;
      }

      if (isFarmerMode) {
        let profileWarning: string | null = null;

        try {
          const profileData = (await getFarmerProfile()) as ApiRecord;
          const profile = (profileData.profile ?? profileData) as ApiRecord;
          const profileFarmerId = Number(profile.id ?? profile.farmer_id ?? profile.farmerId);
          if (Number.isFinite(profileFarmerId) && profileFarmerId > 0) {
            setSelectedFarmerId(profileFarmerId);
          }
          const profileFarmerCode = pickString(profile, 'farmer_code', 'farmerCode');
          if (profileFarmerCode !== '-') {
            setFarmerCode(profileFarmerCode);
          }
          const name = pickString(profile, 'name', 'farmer_name');
          if (name !== '-') {
            setOfficerName(name);
            setFarmerName(name);
            setOperatorName((current) => current || name);
          }
        } catch (profileError) {
          profileWarning = getApiErrorMessage(
            profileError,
            'Some farmer details could not be loaded. You can still save this Biochar activity as draft.',
          );
        }

        if (initialBatchId) {
          try {
            const batchData = (await getFarmerBiocharActivity(initialBatchId)) as ApiRecord;
            const batch = (batchData.batch ?? batchData.activity ?? batchData) as ApiRecord;
            applyBatch(batch);
          } catch (batchError) {
            setError(getApiErrorMessage(batchError, 'Unable to load saved Biochar activity.'));
          }
        } else if (profileWarning) {
          setError(profileWarning);
        }

        setLoading(false);
        return;
      }

      const requests: Promise<unknown>[] = [
        getFieldOfficerProfile(),
        getBiocharProductionUnits(),
        getFieldOfficerFarmers(),
      ];

      if (initialBatchId) {
        requests.push(getFieldOfficerBiocharBatch(initialBatchId));
      }

      const results = await Promise.all(requests);
      const profileData = results[0] as ApiRecord;
      const unitsData = results[1] as ApiRecord;
      const farmersData = results[2] as ApiRecord;

      const user = (profileData.user ?? profileData) as ApiRecord;
      const name = pickString(user, 'name');
      if (name !== '-') {
        setOfficerName(name);
      }

      const mappedUnits = extractList(unitsData as ApiRecord, ['production_units']).map(mapProductionUnit);
      setUnits(mappedUnits);

      const mappedFarmers = extractList(farmersData as ApiRecord, ['farmers'])
        .map(mapFarmerOption)
        .filter((option): option is BiocharFarmerOption => option != null);
      setFarmers(mappedFarmers);

      const resolvedFarmerId = farmerId != null && farmerId > 0 ? farmerId : null;
      if (resolvedFarmerId != null) {
        setSelectedFarmerId(resolvedFarmerId);
        const selectedFarmer = mappedFarmers.find((item) => item.id === resolvedFarmerId);
        if (selectedFarmer) {
          setFarmerName(selectedFarmer.name);
        } else if (selectionPrefill?.farmerName) {
          setFarmerName(selectionPrefill.farmerName);
        }
      }

      if (initialBatchId) {
        const batchData = results[3] as ApiRecord;
        const batch = (batchData.batch ?? batchData) as ApiRecord;
        applyBatch(batch);
        if (resolvedFarmerId != null) {
          setSelectedFarmerId(resolvedFarmerId);
        }
      } else if (!resolvedFarmerId && mappedFarmers.length === 1) {
        setSelectedFarmerId(mappedFarmers[0].id);
        setFarmerName(mappedFarmers[0].name);
      }

      applySelectionPrefill();
      if (resolvedFarmerId != null) {
        setSelectedFarmerId(resolvedFarmerId);
      }

      const farmerIdForFarm = resolvedFarmerId
        ?? (selectedFarmerId != null && selectedFarmerId > 0 ? selectedFarmerId : null)
        ?? (mappedFarmers.length === 1 ? mappedFarmers[0].id : null);

      if ((!farmId || farmId <= 0) && farmerIdForFarm) {
        try {
          const detail = (await getFieldOfficerFarmerDetail(farmerIdForFarm)) as ApiRecord;
          const farmer = (detail.farmer ?? detail) as ApiRecord;
          const farms = extractList(farmer, ['farms']);
          const preferredFarm =
            farms.find((item) => Number(item.id) === Number(farmId)) ??
            farms[0] ??
            null;
          if (preferredFarm) {
            const nextFarmId = Number(preferredFarm.id ?? preferredFarm.farm_id);
            if (Number.isFinite(nextFarmId) && nextFarmId > 0) {
              setResolvedFarmId(nextFarmId);
            }
            const nextFarmCode = pickString(preferredFarm, 'farm_code', 'farmCode');
            if (nextFarmCode !== '-') {
              setResolvedFarmCode(nextFarmCode);
            }
          }
        } catch {
          // Farm context is validated again on submit.
        }
      } else if (farmId && farmId > 0) {
        setResolvedFarmId(farmId);
        if (selectionPrefill?.farmCode) {
          setResolvedFarmCode(selectionPrefill.farmCode);
        }
      }

      if (!initialBatchId && mappedUnits[0]) {
        setSelectedUnitId((current) => current ?? mappedUnits[0].id);
        setKilnId((current) => current || mappedUnits[0].kilnId || mappedUnits[0].label);
        if (mappedUnits[0].operatorName) {
          setOperatorName((current) => current || mappedUnits[0].operatorName || '');
        }
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load biochar production form.'));
    } finally {
      try {
        if (!initialSubmissionUuid && !viewOnly) {
          if (forceNewBatch && !initialBatchId) {
            // Explicit "Add New" — discard any stale draft for this farmer/farm so
            // an abandoned or already-submitted batch can never resurface silently.
            await Promise.all([
              clearBiocharProductionDraft(newDraftStorageKey),
              clearBiocharProductionDraft(draftStorageKey),
            ]);
          } else {
            await restoreLocalDraft(resolvedUserId);
          }
        }
      } catch {
        // Ignore invalid local draft recovery.
      }

      setLoading(false);
    }
  }, [apiMode, applyBatch, applyOfflinePayload, applySelectionPrefill, authUserId, draftStorageKey, farmerId, farmId, forceNewBatch, initialBatchId, initialSubmissionUuid, isArtisanMode, isFarmerMode, newDraftStorageKey, restoreLocalDraft, selectionPrefill?.farmCode, selectionPrefill?.farmerName, viewOnly]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!batchId || initialBatchId) {
      return;
    }

    void migrateBiocharProductionDraft(newDraftStorageKey, draftStorageKey);
  }, [batchId, draftStorageKey, initialBatchId, newDraftStorageKey]);

  useEffect(() => {
    if (loading || !canEdit || skipDraftSaveRef.current) {
      return;
    }

    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }

    draftSaveTimerRef.current = setTimeout(() => {
      if (skipDraftSaveRef.current || !canEdit) {
        return;
      }

      // Client-only form-session persistence (not a visible Draft record).
      // Prefer latest media refs so in-flight captures are not overwritten by stale closures.
      void saveBiocharProductionDraft(draftStorageKey, {
        ...buildLocalDraft(),
        evidence: { ...evidenceRef.current },
        moistureReadings: normalizeMoistureReadings(moistureReadingsRef.current),
      });
    }, 800);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [buildLocalDraft, canEdit, draftStorageKey, loading]);

  const validateFormTimes = useCallback((): string | null => {
    return validateTimeFields({
      'Timestamp time': timestampTime,
      'Start time': startTime,
      'End time': endTime,
      'Final stage time': finalStageTime,
      'Quenching time': quenchingTime,
    });
  }, [endTime, finalStageTime, quenchingTime, startTime, timestampTime]);

  const updateBatchCode = useCallback((value: string) => {
    setBatchCode(value);
    setBatchCodeError(null);
    setError(null);
  }, []);

  const selectFarmer = useCallback((nextFarmerId: number) => {
    setSelectedFarmerId(nextFarmerId);
    const selectedFarmer = farmers.find((item) => item.id === nextFarmerId);
    if (selectedFarmer) {
      setFarmerName(selectedFarmer.name);
    }
    setError(null);
  }, [farmers]);

  const regenerateCodes = useCallback(async () => {
    if (!isFarmerMode && !selectedFarmerId) {
      Alert.alert('Farmer required', 'Select a farmer before generating a Batch ID.');
      return;
    }

    try {
      let response: ApiRecord;

      if (isFarmerMode) {
        response = (await getFarmerBiocharBatchPreviewCodes()) as ApiRecord;
      } else if (isArtisanMode) {
        response = (await getArtisanBiocharBatchPreviewCodes({ farmer_id: selectedFarmerId! })) as ApiRecord;
      } else {
        response = (await getBiocharBatchPreviewCodes({ farmer_id: selectedFarmerId! })) as ApiRecord;
      }

      const codes = (response.codes ?? response) as ApiRecord;

      if (codes.batch_code) {
        setBatchCode(String(codes.batch_code));
        setBatchCodeError(null);
        setError(null);
      }

      if (codes.production_record_code) {
        setProductionRecordCode(String(codes.production_record_code));
      }

      return;
    } catch (generateError) {
      const message = getApiErrorMessage(generateError, 'Unable to generate Batch ID.');
      setError(message);
      Alert.alert('Generate Batch ID', message);
    }
  }, [isArtisanMode, isFarmerMode, selectedFarmerId]);

  const recaptureGps = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setGpsCaptureError('Location permission required. Enable location access to capture production GPS.');
      Alert.alert('Location permission required', 'Enable location access to capture production GPS.');
      return;
    }

    try {
      const capture = await captureBiocharGps();

      if (capture.isPoorAccuracy) {
        setGpsCaptureError(BIOCHAR_POOR_ACCURACY_MESSAGE);
        showBiocharPoorAccuracyWarning();
        return;
      }

      const capturedAt = capture.capturedAt;
      const capturedDate = new Date(capturedAt);

      setLatitude(capture.latitude);
      setLongitude(capture.longitude);
      setAccuracyM(capture.accuracyM);
      setGpsAccuracyTier(capture.accuracyTier);
      setGpsCapturedAt(capturedAt);
      setAltitude(normalizeAltitude(capture.altitude));
      setTimestampDate(capturedDate.toISOString().slice(0, 10));
      setTimestampTime(
        `${String(capturedDate.getHours()).padStart(2, '0')}:${String(capturedDate.getMinutes()).padStart(2, '0')}`,
      );

      if (capture.locationResolved) {
        setVillageName(capture.village);
        setTalukaName(capture.taluka);
        setDistrictName(capture.district);
        setStateName(capture.state);
        setGpsCaptureError(null);
      } else {
        setGpsCaptureError(
          'GPS captured but address lookup failed. You can enter the address manually or tap Retry GPS.',
        );
      }
    } catch (gpsError) {
      const message = getApiErrorMessage(gpsError, 'Unable to capture GPS location.');
      setGpsCaptureError(message);
      Alert.alert('GPS capture failed', message);
    }
  }, []);

  const syncGpsFromCapture = useCallback(async (nextLatitude: number, nextLongitude: number, nextAccuracy: number | null) => {
    setLatitude((current) => (current === nextLatitude ? current : nextLatitude));
    setLongitude((current) => (current === nextLongitude ? current : nextLongitude));
    setAccuracyM((current) => (current === nextAccuracy ? current : nextAccuracy));
    setGpsAccuracyTier(nextAccuracy != null ? classifyArtisanGpsAccuracy(nextAccuracy) : 'unknown');
    setGpsCapturedAt((current) => current ?? new Date().toISOString());
  }, []);

  const syncAltitudeFromCapture = useCallback(async (nextAltitude: number | null) => {
    setAltitude((current) => {
      const normalized = normalizeAltitude(nextAltitude);
      return current === normalized ? current : normalized;
    });
  }, []);

  const selectUnit = useCallback(
    (unitId: number) => {
      setSelectedUnitId(unitId);
      const unit = units.find((item) => item.id === unitId);
      if (unit) {
        setKilnId(unit.kilnId || unit.label);
      }
      if (unit?.operatorName) {
        setOperatorName(unit.operatorName);
      }
    },
    [units],
  );

  const updateKilnId = useCallback(
    (value: string) => {
      const uppercased = value.toUpperCase();
      setKilnId(uppercased);
      const normalized = normalizeKilnId(uppercased);
      const matchedUnit = units.find((unit) => {
        const kilnMatch = normalizeKilnId(unit.kilnId) === normalized;
        const labelMatch = normalizeKilnId(unit.label) === normalized;
        return kilnMatch || labelMatch;
      });
      setSelectedUnitId(matchedUnit?.id ?? null);
    },
    [units],
  );

  const addMoistureReading = useCallback(() => {
    setMoistureReadings((current) => {
      if (current.length >= BIOCHAR_PROCESS_MOISTURE_READING_COUNT) {
        return normalizeMoistureReadings(current);
      }
      return normalizeMoistureReadings([...current, createMoistureReadingDraft(current.length + 1)]);
    });
    setMoistureServerConfirmed(false);
  }, []);

  const updateMoistureReading = useCallback((key: string, field: 'moistureReading' | 'notes', value: string) => {
    setMoistureReadings((current) =>
      current.map((reading) =>
        reading.key === key
          ? {
              ...reading,
              [field]: value,
              uploadStatus:
                reading.uploadStatus === 'uploaded' && field === 'moistureReading' ? 'local_pending' : reading.uploadStatus,
              error: null,
            }
          : reading,
      ),
    );
    if (field === 'moistureReading') {
      setMoistureServerConfirmed(false);
      setMoistureStepError(null);
    }
  }, []);

  const updateMoistureReadingPhoto = useCallback((key: string, asset?: BiocharEvidenceAsset) => {
    setMoistureReadings((current) => {
      const next = current.map((reading) =>
        reading.key === key
          ? {
              ...reading,
              photo: asset,
              evidenceId: asset?.evidenceId != null ? Number(asset.evidenceId) : null,
              uploadStatus: asset?.uploadStatus ?? (asset ? 'local_pending' : 'idle'),
              error: asset?.syncError ?? null,
            }
          : reading,
      );
      moistureReadingsRef.current = next;
      return next;
    });
    setMoistureServerConfirmed(false);
    setMoistureStepError(null);
  }, []);

  const removeMoistureReading = useCallback((key: string) => {
    setMoistureReadings((current) => {
      const next = current.filter((reading) => reading.key !== key);
      return normalizeMoistureReadings(next.length > 0 ? next : createDefaultMoistureReadings());
    });
    setMoistureServerConfirmed(false);
  }, []);

  const persistCapturedAsset = useCallback(
    async (partial: BiocharEvidenceAsset): Promise<BiocharEvidenceAsset> => {
      try {
        return await ensurePersistedEvidenceAsset(partial, draftUuid);
      } catch (persistError) {
        Alert.alert(
          'Storage warning',
          getApiErrorMessage(persistError, 'Could not copy evidence into secure draft storage. Using temporary file for now.'),
        );

        return {
          ...partial,
          source: 'local',
          uploadStatus: 'local_pending',
        };
      }
    },
    [draftUuid],
  );

  const captureMoistureReadingPhoto = useCallback(async (key: string) => {
    // Artisan Biochar Production: no crop/confirm — use in-app camera via processMoistureCameraUri.
    // Officer/Farmer keep ImagePicker; editing disabled to avoid Crop/OK screens.
    const result = await captureLivePhotoEvidence({
      defaultName: `moisture-reading-${key}.jpg`,
      allowsEditing: false,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Capture failed', result.error);
      }

      return;
    }

    const persisted = await persistCapturedAsset({
      uri: result.evidence.uri,
      name: result.evidence.name,
      mimeType: result.evidence.type,
      capturedAt: result.evidence.capturedAt,
      latitude: result.evidence.latitude,
      longitude: result.evidence.longitude,
      accuracy: result.evidence.accuracy,
      isStamped: true,
      isRequired: true,
      uploadStatus: 'local_pending',
    });

    if (__DEV__) {
      console.log('[Moisture] captured sequence photo', { key, hasLocalUri: Boolean(persisted.localUri || persisted.uri) });
    }

    updateMoistureReadingPhoto(key, {
      ...persisted,
      localUri: persisted.localUri || persisted.uri,
      uri: persisted.localUri || persisted.uri,
      uploadStatus: 'local_pending',
    });
  }, [persistCapturedAsset, updateMoistureReadingPhoto]);

  const uploadMoistureReadingPhoto = useCallback(async (key: string) => {
    const result = await pickStampedPhotoEvidence({
      defaultName: `moisture-reading-${key}.jpg`,
      allowsEditing: true,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Upload failed', result.error);
      }

      return;
    }

    const persisted = await persistCapturedAsset({
      uri: result.evidence.uri,
      name: result.evidence.name,
      mimeType: result.evidence.type,
      capturedAt: result.evidence.capturedAt,
      latitude: result.evidence.latitude,
      longitude: result.evidence.longitude,
      accuracy: result.evidence.accuracy,
      isStamped: true,
      isRequired: true,
    });

    updateMoistureReadingPhoto(key, persisted);
  }, [persistCapturedAsset, updateMoistureReadingPhoto]);

  const uploadProcessEvidenceAsset = useCallback(
    async (key: BiocharEvidenceKey, asset: BiocharEvidenceAsset, targetBatchId: number): Promise<BiocharEvidenceAsset> => {
      if (key === 'process_video' || !isArtisanMode) {
        return asset;
      }

      if (asset.evidenceId != null) {
        return asset;
      }

      const uri = asset.localUri || asset.uri;
      if (!uri || uri.startsWith('http://') || uri.startsWith('https://')) {
        return asset;
      }

      const formData = new FormData();
      formData.append('evidence_type', BIOCHAR_EVIDENCE_API_FIELD[key]);
      formData.append('step_key', key);
      formData.append('idempotency_key', `${targetBatchId}:${key}`);
      formData.append('file', {
        uri,
        name: asset.name || `${key}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob);
      if (asset.capturedAt) {
        formData.append('captured_at', asset.capturedAt);
      }
      if (asset.latitude != null) {
        formData.append('latitude', String(asset.latitude));
      }
      if (asset.longitude != null) {
        formData.append('longitude', String(asset.longitude));
      }
      if (asset.accuracy != null) {
        formData.append('gps_accuracy', String(asset.accuracy));
      }

      // Only claim client pre-stamp when the burn actually succeeded locally/server-side.
      if (asset.isStamped !== false) {
        formData.append('evidence_pre_stamped', '1');
        formData.append('client_pre_stamped', '1');
      }

      const response = (await uploadArtisanBiocharProcessEvidence(targetBatchId, formData)) as ApiRecord;
      const uploaded = (response.evidence ?? response) as ApiRecord;
      const remotePath =
        pickString(uploaded, 'stamped_file_path', 'file_path', 'url') !== '-'
          ? pickString(uploaded, 'stamped_file_path', 'file_path', 'url')
          : '';
      const remoteUrl = remotePath ? resolveBiocharEvidenceUrl(remotePath) || remotePath : asset.remoteUrl;

      return {
        ...asset,
        evidenceId: uploaded.id != null ? Number(uploaded.id) : asset.evidenceId,
        remoteUrl: remoteUrl || asset.remoteUrl,
        source: 'remote',
        uploadStatus: 'uploaded',
        syncError: undefined,
      };
    },
    [isArtisanMode],
  );

  const saveEndProcessStampedEvidence = useCallback(
    async (resultEvidence: {
      uri: string;
      name: string;
      type: string;
      capturedAt: string;
      latitude: number | null;
      longitude: number | null;
      accuracy: number | null;
      preStamped?: boolean;
    }) => {
      let persisted = await persistCapturedAsset({
        uri: resultEvidence.uri,
        name: resultEvidence.name,
        mimeType: resultEvidence.type,
        capturedAt: resultEvidence.capturedAt,
        latitude: resultEvidence.latitude,
        longitude: resultEvidence.longitude,
        accuracy: resultEvidence.accuracy,
        isStamped: resultEvidence.preStamped !== false,
        isRequired: true,
      });

      setEvidence((current) => ({
        ...current,
        [END_PROCESS_EVIDENCE_KEY]: { ...persisted, uploadStatus: 'local_pending', syncError: undefined },
      }));
      setEndProcessProcessError(null);
      endProcessPendingRef.current = null;

      if (!isArtisanMode) {
        return;
      }

      try {
        let id = batchId;
        if (!id && farmId) {
          const created = (await createArtisanBiocharProduction(farmId)) as ApiRecord;
          const batch = (created.batch ?? created.record ?? created) as ApiRecord;
          id = Number(batch.id);
          if (Number.isFinite(id) && id > 0) {
            applyBatch(batch);
          }
        }

        if (id) {
          persisted = await uploadProcessEvidenceAsset(END_PROCESS_EVIDENCE_KEY, persisted, id);
          setEvidence((current) => ({
            ...current,
            [END_PROCESS_EVIDENCE_KEY]: persisted,
          }));
        }
      } catch (uploadError) {
        const message = getApiErrorMessage(
          uploadError,
          'Image saved on device but sync failed. It will upload when you are online.',
        );
        setEvidence((current) => ({
          ...current,
          [END_PROCESS_EVIDENCE_KEY]: {
            ...persisted,
            uploadStatus: 'local_pending',
            syncError: message,
          },
        }));
      }
    },
    [applyBatch, batchId, farmId, isArtisanMode, persistCapturedAsset, uploadProcessEvidenceAsset],
  );

  const saveImmediateProcessCapture = useCallback(
    async (key: BiocharEvidenceKey, asset: BiocharEvidenceAsset): Promise<void> => {
      const nextEvidence = {
        ...evidenceRef.current,
        [key]: asset,
      };
      evidenceRef.current = nextEvidence;
      setEvidence(nextEvidence);
      await persistDraftWithLatestMedia({ evidence: nextEvidence });
    },
    [persistDraftWithLatestMedia],
  );

  const processEndProcessEvidence = useCallback(
    async (cameraUri: string, shutterEpochMs?: number): Promise<boolean> => {
      if (isCapturingEndProcessRef.current) {
        return false;
      }

      isCapturingEndProcessRef.current = true;
      setEndProcessProcessing(true);
      setEndProcessProcessError(null);

      const immediate = createImmediateCapturedAsset({
        uri: cameraUri,
        name: `${END_PROCESS_EVIDENCE_KEY}.jpg`,
        shutterEpochMs,
      });
      await saveImmediateProcessCapture(END_PROCESS_EVIDENCE_KEY, immediate);

      try {
        const { result, pending } = await processEndProcessCameraUri({
          cameraUri,
          draftUuid,
          defaultName: `${END_PROCESS_EVIDENCE_KEY}.jpg`,
          shutterEpochMs,
        });

        if (!result.ok) {
          endProcessPendingRef.current = pending;
          setEvidence((current) => ({
            ...current,
            [END_PROCESS_EVIDENCE_KEY]: {
              ...immediate,
              uploadStatus: 'failed',
              syncError: result.error ?? 'Image captured, stamping failed. Retry.',
            },
          }));
          setEndProcessProcessError(
            result.error ?? 'Could not process the End-Process Image. Use Retry Processing or Retake Photo.',
          );
          return false;
        }

        await saveEndProcessStampedEvidence(result.evidence);
        return true;
      } finally {
        setEndProcessProcessing(false);
        isCapturingEndProcessRef.current = false;
      }
    },
    [draftUuid, saveEndProcessStampedEvidence, saveImmediateProcessCapture],
  );

  /** In-app camera path for any process evidence key (including End). */
  const processArtisanEvidenceCameraCapture = useCallback(
    async (key: BiocharEvidenceKey, cameraUri: string, shutterEpochMs: number): Promise<boolean> => {
      if (key === END_PROCESS_EVIDENCE_KEY) {
        return processEndProcessEvidence(cameraUri, shutterEpochMs);
      }

      const immediate = createImmediateCapturedAsset({
        uri: cameraUri,
        name: `${key}.jpg`,
        shutterEpochMs,
      });
      await saveImmediateProcessCapture(key, immediate);

      const { result } = await processEndProcessCameraUri({
        cameraUri,
        draftUuid,
        defaultName: `${key}.jpg`,
        shutterEpochMs,
      });

      if (!result.ok) {
        const message = result.error ?? 'Image captured, stamping failed. Retry.';
        setEvidence((current) => ({
          ...current,
          [key]: {
            ...immediate,
            uploadStatus: 'failed',
            syncError: message,
          },
        }));
        Alert.alert('Image captured', message);
        return false;
      }

      let persisted = await persistCapturedAsset({
        uri: result.evidence.uri,
        name: result.evidence.name,
        mimeType: result.evidence.type,
        capturedAt: result.evidence.capturedAt,
        latitude: result.evidence.latitude,
        longitude: result.evidence.longitude,
        accuracy: result.evidence.accuracy,
        isStamped: result.evidence.preStamped !== false,
        isRequired: true,
      });

      setEvidence((current) => {
        const next = {
          ...current,
          [key]: { ...persisted, uploadStatus: 'local_pending' as const },
        };
        evidenceRef.current = next;
        return next;
      });
      await persistDraftWithLatestMedia({
        evidence: {
          ...evidenceRef.current,
          [key]: { ...persisted, uploadStatus: 'local_pending' },
        },
      });

      if (!isArtisanMode) {
        return true;
      }

      try {
        let id = batchId;
        if (!id && farmId) {
          const created = (await createArtisanBiocharProduction(farmId)) as ApiRecord;
          const batch = (created.batch ?? created.record ?? created) as ApiRecord;
          id = Number(batch.id);
          if (Number.isFinite(id) && id > 0) {
            applyBatch(batch);
          }
        }
        if (id) {
          persisted = await uploadProcessEvidenceAsset(key, persisted, id);
          setEvidence((current) => {
            const next = { ...current, [key]: persisted };
            evidenceRef.current = next;
            return next;
          });
        }
      } catch (uploadError) {
        const message = getApiErrorMessage(
          uploadError,
          'Image saved on device but sync failed. It will upload when you are online.',
        );
        setEvidence((current) => {
          const next = {
            ...current,
            [key]: { ...persisted, uploadStatus: 'failed' as const, syncError: message },
          };
          evidenceRef.current = next;
          return next;
        });
      }

      return true;
    },
    [
      applyBatch,
      batchId,
      draftUuid,
      farmId,
      isArtisanMode,
      persistCapturedAsset,
      persistDraftWithLatestMedia,
      processEndProcessEvidence,
      saveImmediateProcessCapture,
      uploadProcessEvidenceAsset,
    ],
  );

  const processArtisanMoistureCameraCapture = useCallback(
    async (key: string, cameraUri: string, shutterEpochMs: number): Promise<boolean> => {
      if (moistureCaptureLockRef.current) {
        return false;
      }
      moistureCaptureLockRef.current = true;

      try {
        const sequence =
          moistureReadingsRef.current.find((reading) => reading.key === key)?.sequence ??
          Number(/^moisture_(\d)_photo$/.exec(key)?.[1] ?? 1);
        const immediate = createImmediateCapturedAsset({
          uri: cameraUri,
          name: `moisture-reading-${sequence}.jpg`,
          shutterEpochMs,
        });

        const nextReadingsImmediate = normalizeMoistureReadings(
          moistureReadingsRef.current.map((reading) =>
            reading.key === key
              ? {
                  ...reading,
                  photo: immediate,
                  evidenceId: null,
                  uploadStatus: 'local_pending' as const,
                  error: null,
                }
              : reading,
          ),
        );
        moistureReadingsRef.current = nextReadingsImmediate;
        setMoistureReadings(nextReadingsImmediate);
        setMoistureServerConfirmed(false);
        setMoistureStepError(null);
        await persistDraftWithLatestMedia({ moistureReadings: nextReadingsImmediate });

        const { result } = await processEndProcessCameraUri({
          cameraUri,
          draftUuid,
          defaultName: `moisture-reading-${sequence}.jpg`,
          shutterEpochMs,
        });

        if (!result.ok) {
          const message = result.error ?? 'Image captured, stamping failed. Retry.';
          const failedReadings = normalizeMoistureReadings(
            moistureReadingsRef.current.map((reading) =>
              reading.key === key
                ? {
                    ...reading,
                    photo: {
                      ...immediate,
                      uploadStatus: 'failed' as const,
                      syncError: message,
                      // Keep preview URI; do not clear photo on stamp failure.
                      isStamped: false,
                    },
                    uploadStatus: 'failed' as const,
                    error: message,
                  }
                : reading,
            ),
          );
          moistureReadingsRef.current = failedReadings;
          setMoistureReadings(failedReadings);
          await persistDraftWithLatestMedia({ moistureReadings: failedReadings });
          Alert.alert('Image captured', message);
          return false;
        }

        const persisted = await persistCapturedAsset({
          uri: result.evidence.uri,
          name: result.evidence.name,
          mimeType: result.evidence.type,
          capturedAt: result.evidence.capturedAt,
          latitude: result.evidence.latitude,
          longitude: result.evidence.longitude,
          accuracy: result.evidence.accuracy,
          isStamped: result.evidence.preStamped !== false,
          isRequired: true,
          uploadStatus: 'local_pending',
        });

        const stampedPhoto = {
          ...persisted,
          localUri: persisted.localUri || persisted.uri,
          uri: persisted.localUri || persisted.uri,
          uploadStatus: 'local_pending' as const,
        };
        const nextReadingsStamped = normalizeMoistureReadings(
          moistureReadingsRef.current.map((reading) =>
            reading.key === key
              ? {
                  ...reading,
                  photo: stampedPhoto,
                  evidenceId: persisted.evidenceId != null ? Number(persisted.evidenceId) : null,
                  uploadStatus: 'local_pending' as const,
                  error: null,
                }
              : reading,
          ),
        );
        moistureReadingsRef.current = nextReadingsStamped;
        setMoistureReadings(nextReadingsStamped);
        await persistDraftWithLatestMedia({ moistureReadings: nextReadingsStamped });

        return true;
      } finally {
        moistureCaptureLockRef.current = false;
      }
    },
    [draftUuid, persistCapturedAsset, persistDraftWithLatestMedia],
  );

  const retryEndProcessProcessing = useCallback(async (): Promise<boolean> => {
    if (isCapturingEndProcessRef.current) {
      return false;
    }

    const pending = endProcessPendingRef.current;

    if (!pending) {
      setEndProcessProcessError('No saved End-Process Image to retry. Retake the photo.');
      return false;
    }

    isCapturingEndProcessRef.current = true;
    setEndProcessProcessing(true);
    setEndProcessProcessError(null);

    try {
      const result = await stampEndProcessPending(pending);

      if (!result.ok) {
        setEndProcessProcessError(
          result.error ?? 'Could not stamp the End-Process Image. Retake the photo.',
        );
        return false;
      }

      await saveEndProcessStampedEvidence(result.evidence);
      return true;
    } finally {
      setEndProcessProcessing(false);
      isCapturingEndProcessRef.current = false;
    }
  }, [saveEndProcessStampedEvidence]);

  const addEvidence = useCallback(async (key: BiocharEvidenceKey) => {
    if (key === END_PROCESS_EVIDENCE_KEY) {
      // End-Process uses the in-app camera modal + processEndProcessEvidence.
      return;
    }

    const isVideo = key === 'process_video';

    if (isVideo) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission required', 'Enable camera access to capture production evidence.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync(
        liveEvidenceCameraOptions({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.8,
        }),
      );

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const timestamp = createEvidenceCaptureTimestamp({ captureSource: 'live_camera' });
      const persisted = await persistCapturedAsset({
        uri: asset.uri,
        name: asset.fileName ?? `${key}.mp4`,
        mimeType: asset.mimeType,
        capturedAt: timestamp.capturedAtUtc,
        isRequired: true,
      });

      setEvidence((current) => ({
        ...current,
        [key]: persisted,
      }));

      return;
    }

    // Non-artisan or fallback path — never open crop/confirm for live evidence.
    const result = await captureLivePhotoEvidence({
      defaultName: `${key}.jpg`,
      allowsEditing: false,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Capture failed', result.error);
      }

      return;
    }

    let persisted = await persistCapturedAsset({
      uri: result.evidence.uri,
      name: result.evidence.name,
      mimeType: result.evidence.type,
      capturedAt: result.evidence.capturedAt,
      latitude: result.evidence.latitude,
      longitude: result.evidence.longitude,
      accuracy: result.evidence.accuracy,
      isStamped: result.evidence.preStamped !== false,
      isRequired: true,
    });

    setEvidence((current) => ({
      ...current,
      [key]: { ...persisted, uploadStatus: 'local_pending' },
    }));

    if (isArtisanMode) {
      try {
        let id = batchId;
        if (!id && farmId) {
          const created = (await createArtisanBiocharProduction(farmId)) as ApiRecord;
          const batch = (created.batch ?? created.record ?? created) as ApiRecord;
          id = Number(batch.id);
          if (Number.isFinite(id) && id > 0) {
            applyBatch(batch);
          }
        }

        if (id) {
          persisted = await uploadProcessEvidenceAsset(key, persisted, id);
          setEvidence((current) => ({
            ...current,
            [key]: persisted,
          }));
        }
      } catch (uploadError) {
        const message = getApiErrorMessage(uploadError, 'Image saved on device but sync failed. Retry submit to upload.');
        setEvidence((current) => ({
          ...current,
          [key]: { ...persisted, uploadStatus: 'local_pending', syncError: message },
        }));
      }
    }
  }, [applyBatch, batchId, farmId, isArtisanMode, persistCapturedAsset, uploadProcessEvidenceAsset]);

  const uploadEvidence = useCallback(async (key: BiocharEvidenceKey) => {
    if (key === 'process_video') {
      Alert.alert('Upload unavailable', 'Video upload is not used for the Biochar process evidence sequence.');
      return;
    }

    const result = await pickStampedPhotoEvidence({
      defaultName: `${key}.jpg`,
      allowsEditing: true,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Upload failed', result.error);
      }

      return;
    }

    const persisted = await persistCapturedAsset({
      uri: result.evidence.uri,
      name: result.evidence.name,
      mimeType: result.evidence.type,
      capturedAt: result.evidence.capturedAt,
      latitude: result.evidence.latitude,
      longitude: result.evidence.longitude,
      accuracy: result.evidence.accuracy,
      isStamped: true,
      isRequired: true,
    });

    setEvidence((current) => ({
      ...current,
      [key]: persisted,
    }));
  }, [persistCapturedAsset]);

  const removeEvidence = useCallback((key: BiocharEvidenceKey) => {
    if (key === END_PROCESS_EVIDENCE_KEY) {
      endProcessPendingRef.current = null;
      setEndProcessProcessError(null);
    }
    setEvidence((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const buildFormData = useCallback((): FormData => {
    if (!isFarmerMode && !isArtisanMode && !selectedFarmerId) {
      throw new Error('Select a farmer before saving this production record.');
    }

    const formData = new FormData();

    if (!isFarmerMode && !isArtisanMode && selectedFarmerId) {
      formData.append('farmer_id', String(selectedFarmerId));
    }

    const farmIdToSend = resolvedFarmId ?? farmId ?? null;
    if (!isFarmerMode && farmIdToSend) {
      formData.append('farm_id', String(farmIdToSend));
    }
    if (!isFarmerMode && resolvedFarmCode.trim()) {
      formData.append('farm_code', resolvedFarmCode.trim());
    }

    if (productionDate.trim()) {
      formData.append('production_date', productionDate.trim());
    }

    if (batchCode.trim()) {
      formData.append('batch_code', batchCode.trim());
    }

    if (timestampDate.trim()) {
      formData.append('timestamp_date', timestampDate.trim());
    }

    appendTimeField(formData, 'timestamp_time', timestampTime);

    if (selectedUnitId) {
      formData.append('production_unit_id', String(selectedUnitId));
    }
    if (kilnId.trim()) {
      formData.append('kiln_id', normalizeKilnId(kilnId));
    }
    if (operatorName.trim()) {
      formData.append('operator_name', operatorName.trim());
      formData.append('producer_name', operatorName.trim());
    }
    if (feedstockType) {
      formData.append('feedstock_type', feedstockType);
    }
    if (feedstockQuantity.trim()) {
      formData.append('feedstock_quantity', feedstockQuantity.trim());
    }
    formData.append('feedstock_unit', feedstockUnit);
    if (feedstockSize.trim()) {
      formData.append('feedstock_size', feedstockSize.trim());
      formData.append('feedstock_item_details', feedstockSize.trim());
    }
    if (moistureValue.trim()) {
      formData.append('moisture_value', moistureValue.trim());
    }
    if (startTime.trim()) {
      appendTimeField(formData, 'start_time', startTime);
    }
    if (endTime.trim()) {
      appendTimeField(formData, 'end_time', endTime);
    }
    if (temperature.trim()) {
      formData.append('temperature', temperature.trim());
    }
    if (residenceTime.trim()) {
      formData.append('residence_time', residenceTime.trim());
    }
    if (biocharOutput.trim()) {
      formData.append('biochar_output', biocharOutput.trim());
    }
    formData.append('biochar_output_unit', biocharOutputUnit);
    if (latitude != null) {
      formData.append('gps_latitude', String(latitude));
      formData.append('latitude', String(latitude));
    }
    if (longitude != null) {
      formData.append('gps_longitude', String(longitude));
      formData.append('longitude', String(longitude));
    }
    if (accuracyM != null) {
      formData.append('gps_accuracy', String(accuracyM));
    }
    if (gpsCapturedAt) {
      formData.append('captured_at', gpsCapturedAt);
    }
    const normalizedAltitude = normalizeAltitude(altitude);
    if (normalizedAltitude != null) {
      formData.append('altitude', String(normalizedAltitude));
    }
    if (villageName.trim()) {
      formData.append('village_name', villageName.trim());
    }
    if (talukaName.trim()) {
      formData.append('taluka_name', talukaName.trim());
    }
    if (districtName.trim()) {
      formData.append('district_name', districtName.trim());
    }
    if (stateName.trim()) {
      formData.append('state_name', stateName.trim());
    }
    appendTimeField(formData, 'final_stage_time', finalStageTime);
    // Artisan quenching start is set via Start Quenching API; do not overwrite with form default time.
    if (!isArtisanMode) {
      appendTimeField(formData, 'quenching_time', quenchingTime);
    }
    if (officerNotes.trim()) {
      formData.append('officer_notes', officerNotes.trim());
    }

    if (isArtisanMode) {
      if (batchStartedAt) {
        formData.append('batch_started_at', batchStartedAt);
        formData.append('pyrolysis_started_at', batchStartedAt);
      }
      if (processCompletedAt) {
        formData.append('process_completed_at', processCompletedAt);
        formData.append('pyrolysis_finished_at', processCompletedAt);
      }
    }

    const normalizedMoistureReadings = moistureReadings.filter(
      (reading) => reading.moistureReading.trim() || reading.notes.trim() || reading.photo,
    );
    // Artisan moisture uses dedicated per-reading upload; keep draft/save-draft free of moisture files.
    if (!isArtisanMode && normalizedMoistureReadings.length > 0) {
      normalizedMoistureReadings.forEach((reading, index) => {
        const sequenceNumber = reading.sequence || index + 1;
        formData.append(`moisture_readings[${index}][sequence_number]`, String(sequenceNumber));
        formData.append(`moisture_readings[${index}][moisture_reading]`, reading.moistureReading.trim());
        if (reading.notes.trim()) {
          formData.append(`moisture_readings[${index}][notes]`, reading.notes.trim());
        }
        if (shouldUploadEvidenceFile(reading.photo)) {
          const photoUri = reading.photo!.localUri || reading.photo!.uri;
          formData.append(`moisture_readings[${index}][moisture_photo]`, {
            uri: photoUri,
            name: reading.photo!.name,
            type: reading.photo!.mimeType ?? 'application/octet-stream',
          } as unknown as Blob);
        }
        if (reading.photo?.capturedAt) {
          formData.append(`moisture_readings[${index}][captured_at]`, reading.photo.capturedAt);
        }
        if (reading.photo?.latitude != null) {
          formData.append(`moisture_readings[${index}][latitude]`, String(reading.photo.latitude));
        }
        if (reading.photo?.longitude != null) {
          formData.append(`moisture_readings[${index}][longitude]`, String(reading.photo.longitude));
        }
        if (reading.photo?.accuracy != null) {
          formData.append(`moisture_readings[${index}][gps_accuracy]`, String(reading.photo.accuracy));
        }
      });
    }

    const imageEvidence = (Object.keys(BIOCHAR_EVIDENCE_API_FIELD) as BiocharEvidenceKey[])
      .filter((key) => key !== 'process_video')
      .map((key) => evidence[key])
      .filter((asset): asset is BiocharEvidenceAsset => Boolean(asset?.capturedAt && shouldUploadEvidenceFile(asset)));

    if (imageEvidence.length > 0) {
      if (imageEvidence.every((asset) => asset.isStamped !== false)) {
        formData.append('evidence_pre_stamped', '1');
      }

      const latestEvidence = imageEvidence.reduce((latest, asset) =>
        new Date(asset.capturedAt!).getTime() > new Date(latest.capturedAt!).getTime() ? asset : latest,
      );

      formData.append('captured_at', latestEvidence.capturedAt!);

      if (latestEvidence.latitude != null) {
        formData.append('gps_latitude', String(latestEvidence.latitude));
      }

      if (latestEvidence.longitude != null) {
        formData.append('gps_longitude', String(latestEvidence.longitude));
      }

      if (latestEvidence.accuracy != null) {
        formData.append('gps_accuracy', String(latestEvidence.accuracy));
      }
    }

    const appendAsset = (field: string, asset?: BiocharEvidenceAsset) => {
      if (!shouldUploadEvidenceFile(asset)) {
        return;
      }

      formData.append(field, {
        uri: asset!.localUri || asset!.uri,
        name: asset!.name,
        type: asset!.mimeType ?? 'application/octet-stream',
      } as unknown as Blob);
    };

    (Object.keys(BIOCHAR_EVIDENCE_API_FIELD) as BiocharEvidenceKey[]).forEach((key) => {
      appendAsset(BIOCHAR_EVIDENCE_API_FIELD[key], evidence[key]);
    });

    return formData;
  }, [
    accuracyM,
    gpsCapturedAt,
    batchCode,
    batchStartedAt,
    biocharOutput,
    biocharOutputUnit,
    altitude,
    districtName,
    endTime,
    finalStageTime,
    quenchingTime,
    evidence,
    feedstockQuantity,
    feedstockType,
    feedstockUnit,
    isArtisanMode,
    isFarmerMode,
    farmId,
    resolvedFarmCode,
    resolvedFarmId,
    kilnId,
    latitude,
    longitude,
    moistureValue,
    moistureReadings,
    officerNotes,
    operatorName,
    productionDate,
    processCompletedAt,
    residenceTime,
    selectedFarmerId,
    selectedUnitId,
    startTime,
    stateName,
    talukaName,
    timestampDate,
    timestampTime,
    temperature,
    villageName,
  ]);

  const uploadSingleMoistureReading = useCallback(
    async (reading: BiocharMoistureReadingDraft, targetBatchId: number): Promise<BiocharMoistureReadingDraft> => {
      const sequence = reading.sequence;
      const value = reading.moistureReading.trim();

      if (!value) {
        return {
          ...reading,
          uploadStatus: 'failed',
          error: `Moisture Reading ${sequence} value is missing.`,
        };
      }

      if (!reading.photo && reading.evidenceId == null) {
        return {
          ...reading,
          uploadStatus: 'failed',
          error: `Moisture Reading ${sequence} live photo is required.`,
        };
      }

      if (isMoistureReadingServerReady(reading) && !shouldUploadEvidenceFile(reading.photo)) {
        return {
          ...reading,
          uploadStatus: 'uploaded',
          error: null,
        };
      }

      const formData = new FormData();
      formData.append('sequence_number', String(sequence));
      formData.append('moisture_index', String(sequence));
      formData.append('step_key', moistureSlotKey(sequence));
      formData.append('idempotency_key', `${targetBatchId}:${moistureSlotKey(sequence)}`);
      formData.append('moisture_reading', value);
      if (reading.notes.trim()) {
        formData.append('notes', reading.notes.trim());
      }

      if (shouldUploadEvidenceFile(reading.photo)) {
        const photoUri = reading.photo!.localUri || reading.photo!.uri;
        formData.append('moisture_photo', {
          uri: photoUri,
          name: reading.photo!.name || `moisture-reading-${sequence}.jpg`,
          type: reading.photo!.mimeType ?? 'image/jpeg',
        } as unknown as Blob);
      } else if (reading.evidenceId != null) {
        formData.append('evidence_id', String(reading.evidenceId));
      }

      if (reading.photo?.capturedAt) {
        formData.append('captured_at', reading.photo.capturedAt);
      }
      if (reading.photo?.latitude != null) {
        formData.append('latitude', String(reading.photo.latitude));
      }
      if (reading.photo?.longitude != null) {
        formData.append('longitude', String(reading.photo.longitude));
      }
      if (reading.photo?.accuracy != null) {
        formData.append('gps_accuracy', String(reading.photo.accuracy));
      }

      if (__DEV__) {
        console.log('[Moisture] uploading reading', {
          sequence,
          hasPhoto: Boolean(reading.photo),
          evidenceId: reading.evidenceId ?? null,
        });
      }

      const response = (await uploadArtisanBiocharMoistureReading(targetBatchId, formData)) as ApiRecord;
      const saved = (response.moisture_reading ?? response.reading ?? response) as ApiRecord;
      const evidenceId =
        saved.evidence_id != null
          ? Number(saved.evidence_id)
          : reading.evidenceId != null
            ? Number(reading.evidenceId)
            : reading.photo?.evidenceId != null
              ? Number(reading.photo.evidenceId)
              : null;

      if (__DEV__) {
        console.log('[Moisture] upload ok', {
          sequence,
          readingId: saved.id ?? null,
          evidenceId,
          completed: response.completed === true,
          readingsCount: response.readings_count ?? null,
        });
      }

      return {
        ...reading,
        readingId: saved.id != null ? Number(saved.id) : reading.readingId ?? null,
        evidenceId,
        moistureReading: pickString(saved, 'moisture_reading', 'value') !== '-'
          ? pickString(saved, 'moisture_reading', 'value')
          : reading.moistureReading,
        uploadStatus: 'uploaded',
        error: null,
        photo: reading.photo
          ? {
              ...reading.photo,
              evidenceId: evidenceId ?? reading.photo.evidenceId,
              uploadStatus: 'uploaded',
              source: reading.photo.localUri ? 'local' : reading.photo.source,
            }
          : reading.photo,
      };
    },
    [],
  );

  const completeMoistureReadings = useCallback(async (options?: { retryFailedOnly?: boolean }): Promise<boolean> => {
    if (!isArtisanMode) {
      return true;
    }

    if (moistureSyncLockRef.current) {
      return false;
    }

    moistureSyncLockRef.current = true;
    setMoistureSaving(true);
    setMoistureStepError(null);

    const snapshot = normalizeMoistureReadings(moistureReadings);
    const missing: string[] = [];

    snapshot.forEach((reading) => {
      const valueError = moistureReadingValidationError(reading.moistureReading);
      if (valueError) {
        missing.push(
          !reading.moistureReading.trim()
            ? `Moisture Reading ${reading.sequence} value is missing.`
            : `Moisture Reading ${reading.sequence}: ${MOISTURE_READING_LT20_MESSAGE}`,
        );
      }
      if (!reading.photo && reading.evidenceId == null) {
        missing.push(`Moisture Reading ${reading.sequence} live photo is required.`);
      }
    });

    if (missing.length > 0) {
      const message = missing[0];
      setMoistureStepError(message);
      setMoistureReadings((current) =>
        normalizeMoistureReadings(current).map((reading) => {
          const valueError = moistureReadingValidationError(reading.moistureReading);
          if (valueError) {
            return {
              ...reading,
              error: !reading.moistureReading.trim()
                ? `Moisture Reading ${reading.sequence} value is missing.`
                : MOISTURE_READING_LT20_MESSAGE,
              uploadStatus: reading.photo ? reading.uploadStatus : 'failed',
            };
          }
          if (!reading.photo && reading.evidenceId == null) {
            return {
              ...reading,
              error: `Moisture Reading ${reading.sequence} live photo is required.`,
              uploadStatus: 'failed',
            };
          }
          return reading;
        }),
      );
      moistureSyncLockRef.current = false;
      setMoistureSaving(false);
      return false;
    }

    try {
      let id = batchId;
      if (!id) {
        if (!farmId) {
          throw new Error('Farm ID is required before saving moisture readings.');
        }
        const created = (await createArtisanBiocharProduction(farmId)) as ApiRecord;
        const batch = (created.batch ?? created.record ?? created) as ApiRecord;
        id = Number(batch.id);
        if (!Number.isFinite(id) || id <= 0) {
          throw new Error('Unable to create production session for moisture readings.');
        }
        applyBatch(batch);
      }

      setMoistureReadings((current) =>
        normalizeMoistureReadings(current).map((reading) => {
          const shouldUpload =
            options?.retryFailedOnly
              ? reading.uploadStatus === 'failed' || !isMoistureReadingServerReady(reading)
              : !isMoistureReadingServerReady(reading) || shouldUploadEvidenceFile(reading.photo);

          if (!shouldUpload) {
            return reading;
          }

          return { ...reading, uploadStatus: 'uploading', error: null };
        }),
      );

      const working = snapshot;
      const results = await Promise.allSettled(
        working.map(async (reading) => {
          const shouldUpload =
            options?.retryFailedOnly
              ? reading.uploadStatus === 'failed' || !isMoistureReadingServerReady(reading)
              : !isMoistureReadingServerReady(reading) || shouldUploadEvidenceFile(reading.photo);

          if (!shouldUpload) {
            return {
              ...reading,
              uploadStatus: isMoistureReadingServerReady(reading) ? ('uploaded' as const) : reading.uploadStatus,
              error: null,
            };
          }

          try {
            return await uploadSingleMoistureReading(reading, id!);
          } catch (uploadError) {
            const message = getApiErrorMessage(
              uploadError,
              `Moisture Reading ${reading.sequence} photo upload failed.`,
            );
            if (__DEV__) {
              console.log('[Moisture] upload failed', { sequence: reading.sequence, message });
            }
            return {
              ...reading,
              uploadStatus: 'failed' as const,
              error: message,
            };
          }
        }),
      );

      const nextReadings = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }

        return {
          ...working[index],
          uploadStatus: 'failed' as const,
          error: `Moisture Reading ${working[index].sequence} photo upload failed.`,
        };
      });

      // Never clear readings on failure — only update upload status/errors.
      setMoistureReadings(normalizeMoistureReadings(nextReadings));
      await saveBiocharProductionDraft(draftStorageKey, {
        ...buildLocalDraft(),
        moistureReadings: normalizeMoistureReadings(nextReadings),
        batchId: id,
      });

      const failed = nextReadings.filter((reading) => reading.uploadStatus === 'failed');
      const uploadedCount = nextReadings.filter(isMoistureReadingServerReady).length;

      if (failed.length > 0) {
        const failedLabel = failed.map((reading) => `Reading ${reading.sequence}`).join(', ');
        const message = `Unable to complete moisture readings. ${failedLabel} failed. Your other readings have been preserved.`;
        setMoistureStepError(message);
        setMoistureServerConfirmed(false);
        Alert.alert('Moisture readings incomplete', message);
        return false;
      }

      if (uploadedCount < BIOCHAR_PROCESS_MOISTURE_READING_COUNT) {
        const message = `Only ${uploadedCount} of ${BIOCHAR_PROCESS_MOISTURE_READING_COUNT} moisture readings were saved. Retry the failed reading.`;
        setMoistureStepError(message);
        setMoistureServerConfirmed(false);
        Alert.alert('Moisture readings incomplete', message);
        return false;
      }

      setMoistureServerConfirmed(true);
      setMoistureStepError(null);
      setError(null);
      return true;
    } catch (syncError) {
      const message = getApiErrorMessage(
        syncError,
        'Server connection failed. Your readings have been preserved.',
      );
      setMoistureStepError(message);
      setMoistureServerConfirmed(false);
      // Preserve all local moisture values and photos on network/backend failure.
      Alert.alert('Moisture readings not saved', message);
      return false;
    } finally {
      moistureSyncLockRef.current = false;
      setMoistureSaving(false);
    }
  }, [
    applyBatch,
    batchId,
    buildLocalDraft,
    draftStorageKey,
    farmId,
    isArtisanMode,
    moistureReadings,
    uploadSingleMoistureReading,
  ]);

  const persistDraft = useCallback(async (): Promise<number> => {
    const formData = buildFormData();
    formData.append('verification_result', 'draft');

    if (isArtisanMode) {
      if (!farmId) {
        throw new Error('Farm ID is required for artisan biochar production.');
      }

      let id = batchId;

      if (!id) {
        const created = (await createArtisanBiocharProduction(farmId)) as ApiRecord;
        const batch = (created.batch ?? created.record ?? created) as ApiRecord;
        id = Number(batch.id);
        applyBatch(batch);
      }

      const response = (await saveArtisanBiocharProductionDraft(id, formData)) as ApiRecord;
      const batch = (response.batch ?? response.record ?? response) as ApiRecord;
      applyBatch(batch);
      return id;
    }

    if (isFarmerMode) {
      if (batchId) {
        const response = (await saveFarmerBiocharActivityDraft(batchId, formData)) as ApiRecord;
        const batch = (response.batch ?? response.activity ?? response) as ApiRecord;
        applyBatch(batch);
        return batchId;
      }

      if (!pendingFarmerCreateRef.current) {
        pendingFarmerCreateRef.current = (async () => {
          const response = (await createFarmerBiocharActivity(formData)) as ApiRecord;
          const batch = (response.batch ?? response.activity ?? response) as ApiRecord;
          const createdId = Number(batch.id);
          applyBatch(batch);
          return createdId;
        })();
      }

      try {
        return await pendingFarmerCreateRef.current;
      } finally {
        pendingFarmerCreateRef.current = null;
      }
    }

    if (batchId) {
      const response = (await saveFieldOfficerBiocharBatchDraft(batchId, formData)) as ApiRecord;
      const batch = (response.batch ?? response) as ApiRecord;
      applyBatch(batch);
      return batchId;
    }

    const response = (await createOfficerBiocharBatch(formData)) as ApiRecord;
    const batch = (response.batch ?? response) as ApiRecord;
    const createdId = Number(batch.id);
    applyBatch(batch);
    return createdId;
  }, [applyBatch, batchId, buildFormData, farmId, isArtisanMode, isFarmerMode]);

  const applyBatchCodeError = useCallback((message: string) => {
    if (/batch id/i.test(message)) {
      setBatchCodeError(message);
      setError(null);
      return;
    }

    setBatchCodeError(null);
    setError(message);
  }, []);

  const syncPendingEvidence = useCallback(async (): Promise<boolean> => {
    try {
      if (isArtisanMode && batchId) {
        const pendingKeys = (Object.keys(evidence) as BiocharEvidenceKey[]).filter((key) => {
          const asset = evidence[key];
          return Boolean(asset && shouldUploadEvidenceFile(asset));
        });

        for (const key of pendingKeys) {
          const asset = evidence[key];
          if (!asset) {
            continue;
          }
          const uploaded = await uploadProcessEvidenceAsset(key, asset, batchId);
          setEvidence((current) => ({
            ...current,
            [key]: uploaded,
          }));
        }
      }

      await persistDraft();
      await saveBiocharProductionDraft(draftStorageKey, buildLocalDraft());
      return true;
    } catch (syncError) {
      const message = getApiErrorMessage(syncError, 'Unable to upload process images. Check your connection and try again.');
      setError(message);
      Alert.alert('Image upload failed', message);
      return false;
    }
  }, [batchId, buildLocalDraft, draftStorageKey, evidence, isArtisanMode, persistDraft, uploadProcessEvidenceAsset]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    setSubmitting(true);
    setBatchCodeError(null);
    setError(null);

    try {
      const timeError = validateFormTimes();

      if (timeError) {
        throw new Error(timeError);
      }

      await persistDraft();
      // Keep local draft + persistent media so reopen/restart still restores previews.
      await saveBiocharProductionDraft(draftStorageKey, buildLocalDraft());
      return true;
    } catch (draftError) {
      const message = getApiErrorMessage(draftError, 'Unable to save biochar production draft.');
      applyBatchCodeError(message);
      Alert.alert('Draft save failed', message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [applyBatchCodeError, buildLocalDraft, draftStorageKey, persistDraft, validateFormTimes]);

  const submit = useCallback(async (): Promise<BiocharSubmitResult | null> => {
    setSubmitting(true);
    setBatchCodeError(null);
    setError(null);

    try {
      if (!isArtisanMode && !isFarmerMode && !selectedFarmerId) {
        throw new Error('Select a farmer before submitting this Biochar production record.');
      }

      if (!isArtisanMode && !(resolvedFarmId ?? farmId)) {
        throw new Error('Farm is required before submitting this Biochar production record.');
      }

      if (!batchCode.trim()) {
        throw new Error('Generate or enter a Batch ID before submitting.');
      }

      if (!feedstockQuantity.trim()) {
        throw new Error('Enter feedstock quantity before submitting.');
      }

      if (!feedstockType.trim()) {
        throw new Error('Select feedstock type before submitting.');
      }

      if (isArtisanMode && (!feedstockSize.trim() || Number(feedstockSize) <= 0)) {
        throw new Error('Enter a valid feedstock size in cm before submitting.');
      }

      if (isArtisanMode && !selectedUnitId && !isValidArtisanKilnId(kilnId)) {
        throw new Error(
          kilnId.trim()
            ? kilnIdValidationError(kilnId, 'artisan') || 'Enter a valid Kiln ID (BHG-###) or select an existing Pyrolysis Unit.'
            : 'Enter a valid Kiln ID (BHG-###) or select an existing Pyrolysis Unit.',
        );
      }

      if (latitude == null || longitude == null) {
        throw new Error('GPS location is required before submit. Capture GPS and try again.');
      }

      const completedReadings = moistureReadings.filter(
        (reading) => isValidMoistureReadingValue(reading.moistureReading) && (isArtisanMode ? Boolean(reading.photo) : true),
      );
      if (completedReadings.length < 5) {
        throw new Error(
          isArtisanMode
            ? 'Enter all five moisture readings and capture a live photo for each before submitting.'
            : 'Enter all five moisture readings before submitting.',
        );
      }

      const requiredEvidence: BiocharEvidenceKey[] = isArtisanMode
        ? [
            'feedstock_photo',
            'starting_pyrolysis_photo',
            'mid_stage_photo',
            'end_stage_before_quenching_photo',
            'quenching_photo',
            'biochar_unloaded_photo',
            'char_sample_photo',
          ]
        : [
            'feedstock_photo',
            'moisture_image',
            'starting_pyrolysis_photo',
            'mid_stage_photo',
            'end_stage_before_quenching_photo',
            'quenching_photo',
            'biochar_unloaded_photo',
            'biochar_mixing_photo',
          ];

      const missingEvidence = requiredEvidence.find((key) => !isBiocharEvidenceSatisfied(evidence[key]));
      if (missingEvidence) {
        throw new Error('Capture all required Biochar process images before submitting.');
      }

      const failedEvidence = requiredEvidence.find((key) => evidence[key]?.uploadStatus === 'failed' && !isBiocharEvidenceSatisfied(evidence[key]));
      if (failedEvidence) {
        throw new Error('One or more evidence files could not be found. Recapture them before submitting.');
      }

      if (!isArtisanMode && !normalizeTimeForApi(finalStageTime)) {
        throw new Error('Enter final stage time in HH:MM format (24-hour) before submitting.');
      }

      if (!isArtisanMode && !normalizeTimeForApi(quenchingTime)) {
        throw new Error('Enter quenching time in HH:MM format (24-hour) before submitting.');
      }

      if (!normalizeTimeForApi(timestampTime)) {
        throw new Error('Enter timestamp time in HH:MM format (24-hour) before submitting.');
      }

      if (isArtisanMode) {
        if (!batchStartedAt) {
          throw new Error('Capture Batch Start Time before submitting.');
        }
        if (!processCompletedAt) {
          throw new Error('Completion Time is required before submitting.');
        }
        if (!temperature.trim() || !residenceTime.trim() || !biocharOutput.trim()) {
          throw new Error('Complete Process Data before submitting.');
        }

        const authUser = await getAuthUser();
        const artisanId = authUser?.artisan_profile?.id;
        if (!artisanId) {
          throw new Error('Artisan Pro profile is required for submission.');
        }

        // Batch submit is timestamp-sensitive (start/completion/GPS times). If we're
        // offline and have no recent server-time confirmation, the device clock
        // can't be trusted — block the final submit rather than lock in a
        // possibly-fraudulent offline timestamp.
        const isOnlineForSubmit = await safeNetInfoIsConnected();
        if (shouldBlockOfflineTimestampSubmit(isOnlineForSubmit)) {
          throw new Error(
            'Cannot submit offline right now. This step records a timestamp and needs a recent server time sync. Reconnect to the internet, retry sync, and try again.',
          );
        }

        const timeAudit = buildTimeAuditMetadata('biochar_production_submit');

        const formSnapshot: OfflineSubmitFormSnapshot = {
          batchId,
          batchCode,
          productionRecordCode,
          kilnId,
          selectedUnitId,
          selectedFarmerId,
          farmId: resolvedFarmId ?? farmId ?? null,
          farmerName,
          farmCode: resolvedFarmCode,
          productionDate,
          operatorName,
          feedstockQuantity,
          feedstockUnit,
          feedstockType,
          feedstockSize,
          latitude,
          longitude,
          accuracyM,
          altitude,
          villageName,
          talukaName,
          districtName,
          stateName,
          temperature,
          residenceTime,
          biocharOutput,
          biocharOutputUnit,
          timestampDate,
          timestampTime,
          batchStartedAt,
          processCompletedAt,
          pyrolysisStartedAt: batchStartedAt ?? pyrolysisStartedAt,
          pyrolysisFinishedAt: processCompletedAt ?? pyrolysisFinishedAt,
          pyrolysisDurationSeconds,
          quenchingStartedAt,
          moistureReadings,
          evidence: { ...evidence },
          ...timeAudit,
        };

        const missing = validateOfflineProductionSnapshot(formSnapshot);
        if (missing.length > 0) {
          throw new Error(`Cannot submit Biochar Production. Complete:\n• ${missing.join('\n• ')}`);
        }

        const submissionUuid = await createSubmissionUuid();

        // Online-first: submit directly when API is reachable. Only queue Pending Sync
        // on genuine transport/unreachable failures — never on HTTP 422/validation.
        try {
          const id = await persistDraft();

          const moistureSnapshot = normalizeMoistureReadings(moistureReadings);
          for (const reading of moistureSnapshot) {
            if (!reading.photo && reading.evidenceId == null) {
              throw new Error(`Moisture Reading ${reading.sequence} live photo is required.`);
            }
            if (!isMoistureReadingServerReady(reading) || shouldUploadEvidenceFile(reading.photo)) {
              const uploadedReading = await uploadSingleMoistureReading(reading, id);
              setMoistureReadings((current) =>
                normalizeMoistureReadings(current).map((item) =>
                  item.key === uploadedReading.key ? uploadedReading : item,
                ),
              );
            }
          }

          const processKeys: BiocharEvidenceKey[] = [
            'feedstock_photo',
            'starting_pyrolysis_photo',
            'mid_stage_photo',
            'end_stage_before_quenching_photo',
            'quenching_photo',
            'biochar_unloaded_photo',
            'char_sample_photo',
          ];
          for (const key of processKeys) {
            const asset = evidence[key];
            if (!asset || !shouldUploadEvidenceFile(asset)) {
              continue;
            }
            const uploaded = await uploadProcessEvidenceAsset(key, asset, id);
            setEvidence((current) => ({ ...current, [key]: uploaded }));
          }

          await persistDraft();
          const response = (await submitArtisanBiocharProduction(id, {
            idempotencyKey: submissionUuid,
          })) as ApiRecord;
          const batch = (response.batch ?? response.record ?? response) as ApiRecord;
          applyBatch(batch);
          setCanEdit(false);
          setCanSubmit(false);
          setRecordStatus('submitted_for_review');
          await clearLocalDraft();

          const submittedBatchCode = pickString(batch, 'batch_code', 'batchCode');
          return {
            batchCode: submittedBatchCode !== '-' ? submittedBatchCode : batchCode,
            submissionUuid:
              pickString(batch, 'submission_uuid', 'submissionUuid') !== '-'
                ? pickString(batch, 'submission_uuid', 'submissionUuid')
                : submissionUuid,
            status: 'submitted_for_review',
            offline: false,
          };
        } catch (onlineError) {
          if (!isTransportUnreachableError(onlineError)) {
            throw onlineError;
          }

          if (__DEV__) {
            console.warn('[Biochar] Online submit unreachable — saving Pending Sync package', onlineError);
          }
        }

        const { submission } = await createImmutableOfflineSubmission({
          artisanId,
          form: formSnapshot,
        });

        setCanEdit(false);
        setCanSubmit(false);
        setRecordStatus('pending_sync');
        await clearLocalDraft();

        try {
          void syncPendingBiocharProductions(artisanId);
        } catch {
          // Sync is best-effort after local lock.
        }

        return {
          batchCode: submission.batch_code_local || batchCode,
          submissionUuid: submission.submission_uuid,
          status: 'pending_sync',
          offline: true,
        };
      }

      const timeError = validateFormTimes();

      if (timeError) {
        throw new Error(timeError);
      }

      const pendingSynced = await syncPendingEvidence();
      if (!pendingSynced) {
        return null;
      }

      const id = await persistDraft();
      const response = isFarmerMode
        ? ((await submitFarmerBiocharActivity(id)) as ApiRecord)
        : ((await submitFieldOfficerBiocharBatch(id)) as ApiRecord);
      const batch = (response.batch ?? response.activity ?? response) as ApiRecord;
      applyBatch(batch);
      await clearLocalDraft();
      const submittedBatchCode = pickString(batch, 'batch_code', 'batchCode');
      return submittedBatchCode !== '-' ? submittedBatchCode : batchCode;
    } catch (submitError) {
      let message = getApiErrorMessage(submitError, 'Unable to submit biochar production record.');
      if (/property ['"]?reload['"]?/i.test(message) || /DevSettings/i.test(message)) {
        message =
          'Unable to finish local submission on this app build. Fully reload the JS bundle (or restart Metro with cache clear) and try again.';
      }
      applyBatchCodeError(message);
      Alert.alert('Submission failed', message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [
    accuracyM,
    altitude,
    applyBatch,
    applyBatchCodeError,
    batchCode,
    batchId,
    batchStartedAt,
    biocharOutput,
    biocharOutputUnit,
    clearLocalDraft,
    districtName,
    evidence,
    farmId,
    farmerName,
    feedstockQuantity,
    feedstockSize,
    feedstockType,
    feedstockUnit,
    finalStageTime,
    isArtisanMode,
    isFarmerMode,
    kilnId,
    latitude,
    longitude,
    moistureReadings,
    moistureServerConfirmed,
    operatorName,
    persistDraft,
    productionDate,
    productionRecordCode,
    processCompletedAt,
    pyrolysisDurationSeconds,
    pyrolysisFinishedAt,
    pyrolysisStartedAt,
    quenchingStartedAt,
    quenchingTime,
    resolvedFarmCode,
    resolvedFarmId,
    residenceTime,
    selectedFarmerId,
    selectedUnitId,
    stateName,
    syncPendingEvidence,
    talukaName,
    temperature,
    timestampDate,
    timestampTime,
    uploadProcessEvidenceAsset,
    uploadSingleMoistureReading,
    validateFormTimes,
    villageName,
  ]);

  return {
    loading,
    submitting,
    error,
    officerName,
    batchId,
    selectedFarmerId,
    farmers,
    farmerCode,
    productionRecordCode,
    batchCode,
    batchCodeError,
    farmerName,
    productionDate,
    statusLabel,
    recordStatus,
    canEdit,
    canSubmit,
    units,
    selectedUnitId,
    kilnId,
    operatorName,
    latitude,
    longitude,
    accuracyM,
    gpsAccuracyTier,
    gpsCapturedAt,
    gpsCaptureError,
    biocharGpsAccuracyLabel,
    altitude,
    timestampDate,
    timestampTime,
    finalStageTime,
    quenchingTime,
    villageName,
    talukaName,
    districtName,
    stateName,
    feedstockQuantity,
    feedstockUnit,
    feedstockType,
    feedstockSize,
    moistureValue,
    moistureReadings,
    moistureSaving,
    moistureStepError,
    moistureServerConfirmed,
    startTime,
    endTime,
    temperature,
    residenceTime,
    biocharOutput,
    biocharOutputUnit,
    officerNotes,
    evidence,
    endProcessProcessing,
    endProcessProcessError,
    pyrolysisStartedAt,
    pyrolysisFinishedAt,
    pyrolysisDurationSeconds,
    pyrolysisDurationLabel,
    batchStartedAt,
    processCompletedAt,
    quenchingStartedAt,
    resolvedFarmCode,
    resolvedFarmId,
    mapPreviewUrl: latitude != null && longitude != null ? buildGoogleMapsUrl(latitude, longitude) : undefined,
    gpsCaptured: latitude != null && longitude != null,
    setFeedstockQuantity,
    setFeedstockUnit,
    setFeedstockType,
    setFeedstockSize,
    setMoistureValue,
    setStartTime,
    setEndTime,
    setTemperature,
    setResidenceTime,
    setBiocharOutput,
    setBiocharOutputUnit,
    setOfficerNotes,
    setOperatorName,
    setBatchCode: updateBatchCode,
    setProductionDate,
    setTimestampDate,
    setTimestampTime,
    setFinalStageTime,
    setQuenchingTime,
    setPyrolysisStartedAt,
    setPyrolysisFinishedAt,
    setPyrolysisDurationSeconds,
    setPyrolysisDurationLabel,
    setBatchStartedAt,
    setProcessCompletedAt,
    setQuenchingStartedAt,
    setVillageName,
    setTalukaName,
    setDistrictName,
    setStateName,
    setAltitude,
    setAltitudeInput: (value: string) => setAltitude(parseAltitudeInput(value)),
    selectUnit,
    selectFarmer,
    selectFarm: (nextFarmId: number) => {
      setResolvedFarmId(nextFarmId);
    },
    setKilnId: updateKilnId,
    regenerateCodes,
    recaptureGps,
    syncGpsFromCapture,
    syncAltitudeFromCapture,
    addMoistureReading,
    updateMoistureReading,
    removeMoistureReading,
    captureMoistureReadingPhoto,
    uploadMoistureReadingPhoto,
    completeMoistureReadings,
    addEvidence,
    processEndProcessEvidence,
    processArtisanEvidenceCameraCapture,
    processArtisanMoistureCameraCapture,
    retryEndProcessProcessing,
    uploadEvidence,
    removeEvidence,
    submit,
    saveDraft,
    syncPendingEvidence,
    attachBatchId: setBatchId,
    applyRemoteBatch: applyBatch,
    reload: loadInitialData,
  };
}
