import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  completeArtisanBiocharMixing,
  getArtisanBiocharMixing,
  getArtisanBiocharMixingEligibleBatches,
  getArtisanProfile,
} from '../api/artisanApi';
import {
  completeOfficerFarmerBiocharMixing,
  getFieldOfficerFarmerDetail,
  getOfficerBiocharMixing,
  getOfficerFarmerBiocharMixingEligibleBatches,
  getFieldOfficerProfile,
} from '../api/fieldOfficerApi';
import {
  completeFarmerBiocharMixing,
  getFarmerBiocharMixing,
  getFarmerBiocharMixingEligibleBatches,
  getFarmerFarms,
  getFarmerProfile,
} from '../api/farmerApi';
import {
  BIOCHAR_MIXING_EVIDENCE_API_FIELD,
  type BiocharMixingEvidenceKey,
} from '../constants/biocharMixing';
import type { MixingLocationStatus } from '../components/biochar/BiocharMixingSections';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { captureLivePhotoEvidence } from '../utils/liveEvidenceCapture';
import {
  captureBiocharGps,
  showBiocharPoorAccuracyWarning,
} from '../utils/biocharGpsCapture';
import type { ArtisanGpsAccuracyTier } from '../utils/artisanGpsAccuracy';
import { classifyArtisanGpsAccuracy } from '../utils/artisanGpsAccuracy';

export type BiocharMixingEvidenceAsset = {
  uri: string;
  remoteUrl?: string;
  capturedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  isDocument?: boolean;
};

export type BiocharMixingEligibleBatch = {
  id: number;
  batchCode: string;
  farmId: number | null;
  farmCode: string;
  farmerId: number | null;
  farmerCode: string;
  productionDate: string;
  feedstockType: string;
  producedQuantity: number;
  usedQuantity: number;
  alreadyMixedQuantity: number;
  availableQuantity: number;
  unit: string;
  status: string;
  statusLabel: string;
};

export type BiocharMixingSubmitResult = {
  mixingCode: string;
  mixingId: number;
  farmId: number | null;
  farmCode: string;
  farmerId: number | null;
  farmerCode: string;
  farmerName: string;
  selectedBatchIds: number[];
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  biocharApplicationRouteReady: boolean;
  hasBiocharApplication: boolean;
  linkedApplicationId: number | null;
};

interface UseBiocharMixingFormOptions {
  farmerId?: number;
  farmId?: number;
  recordId?: number;
  apiMode?: 'officer' | 'farmer' | 'artisan';
  selectionPrefill?: {
    farmerName?: string;
    farmerCode?: string;
    farmCode?: string;
    farmLabel?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
  };
}

function mapEligibleBatch(raw: ApiRecord): BiocharMixingEligibleBatch {
  const usedQuantity = Number(
    raw.used_quantity ?? raw.usedQuantity ?? raw.already_mixed_quantity ?? raw.alreadyMixedQuantity ?? 0,
  );

  return {
    id: Number(raw.id ?? raw.batch_id ?? 0),
    batchCode: pickString(raw, 'batch_code', 'batchCode') !== '-' ? pickString(raw, 'batch_code', 'batchCode') : '',
    farmId: raw.farm_id != null ? Number(raw.farm_id) : null,
    farmCode: pickString(raw, 'farm_code', 'farmCode') !== '-' ? pickString(raw, 'farm_code', 'farmCode') : '',
    farmerId: raw.farmer_id != null ? Number(raw.farmer_id) : null,
    farmerCode: pickString(raw, 'farmer_code', 'farmerCode') !== '-' ? pickString(raw, 'farmer_code', 'farmerCode') : '',
    productionDate:
      pickString(raw, 'production_date', 'productionDate') !== '-'
        ? pickString(raw, 'production_date', 'productionDate')
        : '',
    feedstockType:
      pickString(raw, 'feedstock_type', 'feedstockType') !== '-'
        ? pickString(raw, 'feedstock_type', 'feedstockType')
        : '',
    producedQuantity: Number(raw.produced_quantity ?? raw.producedQuantity ?? 0),
    usedQuantity,
    alreadyMixedQuantity: Number(
      raw.already_mixed_quantity ?? raw.alreadyMixedQuantity ?? raw.used_quantity ?? raw.usedQuantity ?? usedQuantity,
    ),
    availableQuantity: Number(raw.available_quantity ?? raw.availableQuantity ?? 0),
    unit: pickString(raw, 'unit') !== '-' ? pickString(raw, 'unit') : 'kg',
    status: pickString(raw, 'status') !== '-' ? pickString(raw, 'status') : '',
    statusLabel:
      pickString(raw, 'status_label', 'statusLabel') !== '-'
        ? pickString(raw, 'status_label', 'statusLabel')
        : pickString(raw, 'status'),
  };
}

function mapSelectedBatchIds(record: ApiRecord): number[] {
  if (Array.isArray(record.selected_batches)) {
    return (record.selected_batches as ApiRecord[])
      .map((item) => Number(item.batch_id ?? item.id ?? 0))
      .filter((id) => id > 0);
  }

  const batch = (record.batch ?? null) as ApiRecord | null;

  if (record.batch_id != null) {
    return [Number(record.batch_id)];
  }

  if (batch?.id != null) {
    return [Number(batch.id)];
  }

  return [];
}

function hydrateRecord(record: ApiRecord) {
  const status = pickString(record, 'status') !== '-' ? pickString(record, 'status') : 'draft';
  const isSubmitted = status === 'submitted' || status === 'completed';

  return {
    recordId: Number(record.id),
    mixingRecordId: pickString(record, 'mixing_record_id', 'mixingRecordId', 'mixing_code', 'mixingCode'),
    state: pickString(record, 'state') !== '-' ? pickString(record, 'state') : '',
    site: pickString(record, 'site') !== '-' ? pickString(record, 'site') : '',
    dateOfMixing:
      pickString(record, 'date_of_mixing', 'dateOfMixing') !== '-'
        ? pickString(record, 'date_of_mixing', 'dateOfMixing').slice(0, 10)
        : todayIsoDate(),
    latitude: record.latitude != null ? Number(record.latitude) : null,
    longitude: record.longitude != null ? Number(record.longitude) : null,
    altitude: record.altitude != null ? Number(record.altitude) : null,
    accuracyM: record.gps_accuracy != null ? Number(record.gps_accuracy) : null,
    gpsCapturedAt:
      pickString(record, 'location_captured_at', 'locationCapturedAt', 'captured_at', 'capturedAt') !== '-'
        ? pickString(record, 'location_captured_at', 'locationCapturedAt', 'captured_at', 'capturedAt')
        : null,
    villageName:
      pickString(record, 'village_name', 'villageName') !== '-'
        ? pickString(record, 'village_name', 'villageName')
        : '',
    talukaName:
      pickString(record, 'taluka_name', 'talukaName') !== '-'
        ? pickString(record, 'taluka_name', 'talukaName')
        : '',
    districtName:
      pickString(record, 'district_name', 'districtName') !== '-'
        ? pickString(record, 'district_name', 'districtName')
        : '',
    stateName: pickString(record, 'state') !== '-' ? pickString(record, 'state') : '',
    farmerName:
      pickString(record, 'farmer_name', 'farmerName') !== '-'
        ? pickString(record, 'farmer_name', 'farmerName')
        : '',
    farmerCode:
      pickString(record, 'farmer_code', 'farmerCode') !== '-'
        ? pickString(record, 'farmer_code', 'farmerCode')
        : '',
    farmName:
      pickString(record, 'farm_name', 'farmName') !== '-' ? pickString(record, 'farm_name', 'farmName') : '',
    farmCode:
      pickString(record, 'farm_code', 'farmCode') !== '-' ? pickString(record, 'farm_code', 'farmCode') : '',
    resolvedFarmId: record.farm_id != null ? Number(record.farm_id) : null,
    selectedBatchIds: mapSelectedBatchIds(record),
    notes: pickString(record, 'notes') !== '-' ? pickString(record, 'notes') : '',
    canEdit: !isSubmitted && record.can_edit !== false,
    canSubmit: !isSubmitted && record.can_submit !== false,
    status,
    biocharApplicationRouteReady: Boolean(record.biochar_application_route_ready),
    hasBiocharApplication: Boolean(record.has_biochar_application),
    linkedApplicationId: record.linked_application_id != null ? Number(record.linked_application_id) : null,
  };
}

function mapRemoteEvidences(record: ApiRecord): Partial<Record<BiocharMixingEvidenceKey, BiocharMixingEvidenceAsset>> {
  const evidences = Array.isArray(record.evidences) ? record.evidences : [];
  const mapped: Partial<Record<BiocharMixingEvidenceKey, BiocharMixingEvidenceAsset>> = {};

  for (const item of evidences as ApiRecord[]) {
    const key = pickString(item, 'evidence_type', 'evidenceType') as BiocharMixingEvidenceKey;
    const url = pickString(item, 'url', 'file_path', 'filePath');

    if (key && url !== '-') {
      mapped[key] = {
        uri: url,
        remoteUrl: url,
        latitude: item.latitude != null ? Number(item.latitude) : null,
        longitude: item.longitude != null ? Number(item.longitude) : null,
        accuracy: item.gps_accuracy != null ? Number(item.gps_accuracy) : null,
        capturedAt:
          pickString(item, 'captured_at', 'capturedAt') !== '-'
            ? pickString(item, 'captured_at', 'capturedAt')
            : undefined,
        isDocument: key === 'farmer_consent_signed_copy' && !url.toLowerCase().includes('.jpg'),
      };
    }
  }

  return mapped;
}

function isOutOfZoneMessage(message: string): boolean {
  return /outside your assigned|out of zone|outside your allocated/i.test(message);
}

export function useBiocharMixingForm({
  farmerId,
  farmId: initialFarmId,
  recordId: initialRecordId,
  apiMode = 'farmer',
  selectionPrefill,
}: UseBiocharMixingFormOptions = {}) {
  const isOfficerMode = apiMode === 'officer';
  const isArtisanMode = apiMode === 'artisan';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<number | null>(initialRecordId ?? null);
  const [mixingRecordId, setMixingRecordId] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  const [canSubmit, setCanSubmit] = useState(true);
  const [recordStatus, setRecordStatus] = useState<string | null>(initialRecordId ? 'draft' : null);

  const [resolvedFarmId, setResolvedFarmId] = useState<number | null>(initialFarmId ?? null);
  const [resolvedFarmerId, setResolvedFarmerId] = useState<number | null>(farmerId ?? null);
  const [state, setState] = useState('');
  const [site, setSite] = useState('');
  const [dateOfMixing] = useState(todayIsoDate());
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [gpsAccuracyTier, setGpsAccuracyTier] = useState<ArtisanGpsAccuracyTier>('unknown');
  const [gpsCapturedAt, setGpsCapturedAt] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<MixingLocationStatus>('pending');
  const [villageName, setVillageName] = useState(selectionPrefill?.village ?? '');
  const [talukaName, setTalukaName] = useState(selectionPrefill?.taluka ?? '');
  const [districtName, setDistrictName] = useState(selectionPrefill?.district ?? '');
  const [stateName, setStateName] = useState(selectionPrefill?.state ?? '');
  const [farmerName, setFarmerName] = useState(selectionPrefill?.farmerName ?? '');
  const [farmerCode, setFarmerCode] = useState(selectionPrefill?.farmerCode ?? '');
  const [farmName, setFarmName] = useState(selectionPrefill?.farmLabel ?? '');
  const [farmCode, setFarmCode] = useState(selectionPrefill?.farmCode ?? '');
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [batches, setBatches] = useState<BiocharMixingEligibleBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);
  const [batchesEmptyMessage, setBatchesEmptyMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<Partial<Record<BiocharMixingEvidenceKey, BiocharMixingEvidenceAsset>>>({});
  const [biocharApplicationRouteReady, setBiocharApplicationRouteReady] = useState(false);
  const [hasBiocharApplication, setHasBiocharApplication] = useState(false);
  const [linkedApplicationId, setLinkedApplicationId] = useState<number | null>(null);

  const statusLabel = useMemo(() => {
    if (!recordId || !recordStatus) {
      return 'New Biochar Mixing';
    }

    if (recordStatus === 'submitted' || recordStatus === 'completed') {
      return 'Submitted';
    }

    return pickString({ status: recordStatus }, 'status');
  }, [recordId, recordStatus]);

  const heroMeta = useMemo(() => {
    if (!recordId) {
      return 'New Biochar Mixing';
    }

    if (mixingRecordId) {
      return mixingRecordId;
    }

    return statusLabel;
  }, [mixingRecordId, recordId, statusLabel]);

  const selectedBatches = useMemo(
    () => batches.filter((batch) => selectedBatchIds.includes(batch.id)),
    [batches, selectedBatchIds],
  );
  const selectedBatchCount = selectedBatches.length;
  const combinedSelectedQuantity = useMemo(
    () => Math.round(selectedBatches.reduce((sum, batch) => sum + Number(batch.availableQuantity || 0), 0) * 100) / 100,
    [selectedBatches],
  );

  const applyFarmContext = useCallback((farm: ApiRecord, farmer?: ApiRecord) => {
    const nextFarmId = Number(farm.id ?? farm.farm_id ?? farm.farmId);
    if (Number.isFinite(nextFarmId) && nextFarmId > 0) {
      setResolvedFarmId(nextFarmId);
    }

    const nextFarmName = pickString(farm, 'farm_name', 'farmName', 'name');
    const nextFarmCode = pickString(farm, 'farm_code', 'farmCode');
    const nextVillage = pickString(farm, 'village', 'village_name', 'villageName');
    const nextTaluka = pickString(farm, 'taluka', 'taluka_name', 'talukaName');
    const nextDistrict = pickString(farm, 'district', 'district_name', 'districtName');

    if (nextFarmName !== '-') {
      setFarmName(nextFarmName);
    }
    if (nextFarmCode !== '-') {
      setFarmCode(nextFarmCode);
    }
    if (nextVillage !== '-') {
      setVillageName((current) => current || nextVillage);
    }
    if (nextTaluka !== '-') {
      setTalukaName((current) => current || nextTaluka);
    }
    if (nextDistrict !== '-') {
      setDistrictName((current) => current || nextDistrict);
    }

    setSite((current) => {
      if (current.trim()) {
        return current;
      }
      if (nextFarmName !== '-') {
        return nextFarmName;
      }
      if (nextVillage !== '-') {
        return nextVillage;
      }
      return current;
    });

    if (farmer) {
      const nextFarmerName = pickString(farmer, 'name', 'farmer_name', 'farmerName');
      const nextFarmerCode = pickString(farmer, 'farmer_code', 'farmerCode');
      if (nextFarmerName !== '-' && nextFarmerName.toLowerCase() !== 'farmer') {
        setFarmerName(nextFarmerName);
      }
      if (nextFarmerCode !== '-') {
        setFarmerCode(nextFarmerCode);
      }
      const nextFarmerId = Number(farmer.id ?? farmer.farmer_id ?? 0);
      if (Number.isFinite(nextFarmerId) && nextFarmerId > 0) {
        setResolvedFarmerId(nextFarmerId);
      }
    }
  }, []);

  const applyRecord = useCallback((record: ApiRecord) => {
    const hydrated = hydrateRecord(record);
    setRecordId(hydrated.recordId);
    setMixingRecordId(hydrated.mixingRecordId !== '-' ? hydrated.mixingRecordId : '');
    setState(hydrated.state);
    setStateName(hydrated.stateName || hydrated.state);
    setSite(hydrated.site);
    setLatitude(hydrated.latitude);
    setLongitude(hydrated.longitude);
    setAltitude(hydrated.altitude);
    setAccuracyM(hydrated.accuracyM);
    setGpsCapturedAt(hydrated.gpsCapturedAt);
    setVillageName(hydrated.villageName);
    setTalukaName(hydrated.talukaName);
    setDistrictName(hydrated.districtName);
    setFarmerName(hydrated.farmerName);
    setFarmerCode(hydrated.farmerCode);
    setFarmName(hydrated.farmName);
    setFarmCode(hydrated.farmCode);
    if (hydrated.resolvedFarmId) {
      setResolvedFarmId(hydrated.resolvedFarmId);
    }
    if (record.farmer_id != null) {
      setResolvedFarmerId(Number(record.farmer_id));
    }
    setSelectedBatchIds(hydrated.selectedBatchIds);
    setNotes(hydrated.notes);
    setCanEdit(hydrated.canEdit);
    setCanSubmit(hydrated.canSubmit);
    setRecordStatus(hydrated.status);
    setBiocharApplicationRouteReady(hydrated.biocharApplicationRouteReady);
    setHasBiocharApplication(hydrated.hasBiocharApplication);
    setLinkedApplicationId(hydrated.linkedApplicationId);
    setEvidence(mapRemoteEvidences(record));

    if (hydrated.latitude != null && hydrated.longitude != null) {
      setLocationStatus('captured');
      if (hydrated.accuracyM != null) {
        setGpsAccuracyTier(classifyArtisanGpsAccuracy(hydrated.accuracyM));
      }
    }
  }, []);

  const loadEligibleBatches = useCallback(
    async (farmIdForBatches: number, farmerIdForOfficer?: number) => {
      if (!farmIdForBatches) {
        setBatches([]);
        setBatchesError('Farm ID is required to load batches.');
        return;
      }

      setLoadingBatches(true);
      setBatchesError(null);
      setBatchesEmptyMessage(null);

      try {
        const response = (
          isArtisanMode
            ? await getArtisanBiocharMixingEligibleBatches({ farm_id: farmIdForBatches })
            : isOfficerMode
              ? await getOfficerFarmerBiocharMixingEligibleBatches(farmerIdForOfficer ?? farmerId ?? 0, {
                  farm_id: farmIdForBatches,
                })
              : await getFarmerBiocharMixingEligibleBatches({ farm_id: farmIdForBatches })
        ) as ApiRecord;

        const list = extractList(response, ['batches']);
        const mapped = list.map(mapEligibleBatch).filter((batch) => batch.id > 0);
        setBatches(mapped);

        if (mapped.length === 0) {
          setBatchesEmptyMessage('No approved Biochar Production Batch is available for this farm.');
        }

        setSelectedBatchIds((current) => current.filter((id) => mapped.some((batch) => batch.id === id)));
      } catch (batchError) {
        const message = getApiErrorMessage(batchError, 'Unable to load batches for this farm.');
        setBatches([]);
        if (isOutOfZoneMessage(message)) {
          setLocationStatus('out_of_zone');
          setBatchesError('Out of Zone');
        } else {
          setBatchesError(message);
        }
      } finally {
        setLoadingBatches(false);
      }
    },
    [farmerId, isArtisanMode, isOfficerMode],
  );

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let farmIdToUse = initialFarmId ?? resolvedFarmId;

      if (isArtisanMode) {
        if (selectionPrefill?.farmerName) {
          setFarmerName(selectionPrefill.farmerName);
        }
        if (selectionPrefill?.farmerCode) {
          setFarmerCode(selectionPrefill.farmerCode);
        }
        if (selectionPrefill?.farmLabel) {
          setFarmName(selectionPrefill.farmLabel);
        }
        if (selectionPrefill?.farmCode) {
          setFarmCode(selectionPrefill.farmCode);
        }
        if (selectionPrefill?.village) {
          setVillageName(selectionPrefill.village);
          setSite((current) => current || selectionPrefill.farmLabel || selectionPrefill.village || '');
        }
        try {
          await getArtisanProfile();
        } catch {
          // optional
        }
      } else if (isOfficerMode) {
        try {
          await getFieldOfficerProfile();
        } catch {
          // optional
        }

        if (farmerId) {
          const detail = (await getFieldOfficerFarmerDetail(farmerId)) as ApiRecord;
          const farmer = (detail.farmer ?? detail) as ApiRecord;
          const farms = Array.isArray(farmer.farms) ? (farmer.farms as ApiRecord[]) : [];
          const selectedFarm =
            (farmIdToUse ? farms.find((farm) => Number(farm.id) === Number(farmIdToUse)) : null) ?? farms[0];

          if (selectedFarm) {
            applyFarmContext(selectedFarm, farmer);
            farmIdToUse = Number(selectedFarm.id);
          } else {
            const name = pickString(farmer, 'name', 'farmer_name', 'farmerName');
            const code = pickString(farmer, 'farmer_code', 'farmerCode');
            if (name !== '-' && name.toLowerCase() !== 'farmer') {
              setFarmerName(name);
            }
            if (code !== '-') {
              setFarmerCode(code);
            }
            const nextFarmerId = Number(farmer.id ?? farmer.farmer_id ?? farmerId ?? 0);
            if (Number.isFinite(nextFarmerId) && nextFarmerId > 0) {
              setResolvedFarmerId(nextFarmerId);
            }
          }
        }
      } else {
        try {
          const profile = (await getFarmerProfile()) as ApiRecord;
          const nested = (profile.profile ?? profile.user ?? profile) as ApiRecord;
          const name = pickString(nested, 'name', 'farmer_name', 'farmerName');
          const code = pickString(nested, 'farmer_code', 'farmerCode');
          if (name !== '-' && name.toLowerCase() !== 'farmer') {
            setFarmerName(name);
          }
          if (code !== '-') {
            setFarmerCode(code);
          }
        } catch {
          // optional
        }

        try {
          const farmsResponse = (await getFarmerFarms()) as ApiRecord;
          const farms = Array.isArray(farmsResponse.farms)
            ? (farmsResponse.farms as ApiRecord[])
            : Array.isArray(farmsResponse)
              ? (farmsResponse as ApiRecord[])
              : [];
          const selectedFarm =
            (farmIdToUse ? farms.find((farm) => Number(farm.id) === Number(farmIdToUse)) : null) ?? farms[0];
          if (selectedFarm) {
            applyFarmContext(selectedFarm);
            farmIdToUse = Number(selectedFarm.id);
          }
        } catch {
          // optional
        }
      }

      if (recordId) {
        const response = isArtisanMode
          ? ((await getArtisanBiocharMixing(recordId)) as ApiRecord)
          : isOfficerMode
            ? ((await getOfficerBiocharMixing(recordId)) as ApiRecord)
            : ((await getFarmerBiocharMixing(recordId)) as ApiRecord);

        const record = (response.mixing ?? response.record ?? response) as ApiRecord;
        applyRecord(record);
        farmIdToUse = Number(record.farm_id ?? farmIdToUse);
      }

      if (farmIdToUse) {
        setResolvedFarmId(farmIdToUse);
        await loadEligibleBatches(farmIdToUse, farmerId);
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load Biochar Mixing form.'));
    } finally {
      setLoading(false);
    }
  }, [
    applyFarmContext,
    applyRecord,
    farmerId,
    initialFarmId,
    isArtisanMode,
    isOfficerMode,
    loadEligibleBatches,
    recordId,
    resolvedFarmId,
    selectionPrefill?.farmCode,
    selectionPrefill?.farmLabel,
    selectionPrefill?.farmerCode,
    selectionPrefill?.farmerName,
    selectionPrefill?.village,
  ]);

  useEffect(() => {
    void loadInitialData();
    // Intentionally mount/record-scoped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiMode, farmerId, initialFarmId, initialRecordId]);

  const recaptureGps = useCallback(async () => {
    setCapturingGps(true);
    setLocationStatus('capturing');

    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Location capture timed out. Please retry.')), 30000);
    });

    try {
      const capture = await Promise.race([captureBiocharGps(), timeout]);
      setLatitude(capture.latitude);
      setLongitude(capture.longitude);
      setAccuracyM(capture.accuracyM);
      setGpsAccuracyTier(capture.accuracyTier);
      setGpsCapturedAt(capture.capturedAt);
      if (capture.altitude != null) {
        setAltitude(capture.altitude);
      }

      if (capture.locationResolved) {
        setVillageName(capture.village);
        setTalukaName(capture.taluka);
        setDistrictName(capture.district);
        setStateName(capture.state);
        setState(capture.state);
        setSite((current) => current || farmName || capture.village || current);
      }

      if (capture.isPoorAccuracy) {
        setLocationStatus('poor_accuracy');
        showBiocharPoorAccuracyWarning();
      } else {
        setLocationStatus('captured');
      }
    } catch (gpsError) {
      const message = getApiErrorMessage(gpsError, 'Unable to capture GPS location.');
      if (/permission/i.test(message)) {
        setLocationStatus('permission_denied');
      } else if (/timed out|timeout/i.test(message)) {
        setLocationStatus('timeout');
      } else if (isOutOfZoneMessage(message)) {
        setLocationStatus('out_of_zone');
      } else {
        setLocationStatus('error');
      }
      Alert.alert('GPS capture failed', message);
    } finally {
      setCapturingGps(false);
    }
  }, [farmName]);

  const addEvidence = useCallback(async (key: BiocharMixingEvidenceKey) => {
    if (key === 'farmer_consent_signed_copy') {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['image/*', 'application/pdf'],
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      const asset = picked.assets[0];
      const isImage = (asset.mimeType ?? '').startsWith('image/');

      setEvidence((current) => ({
        ...current,
        [key]: {
          uri: asset.uri,
          isDocument: !isImage,
        },
      }));
      return;
    }

    const result = await captureLivePhotoEvidence();
    if (!result.ok) {
      return;
    }

    const captured = result.evidence;
    setEvidence((current) => ({
      ...current,
      [key]: {
        uri: captured.previewUri,
        capturedAt: captured.capturedAt,
        latitude: captured.latitude,
        longitude: captured.longitude,
        accuracy: captured.accuracy,
      },
    }));
  }, []);

  const removeEvidence = useCallback((key: BiocharMixingEvidenceKey) => {
    setEvidence((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const toggleBatchSelection = useCallback((batchId: number) => {
    setSelectedBatchIds((current) =>
      current.includes(batchId) ? current.filter((id) => id !== batchId) : [...current, batchId],
    );
  }, []);

  const selectAllBatches = useCallback(() => {
    setSelectedBatchIds(batches.map((batch) => batch.id));
  }, [batches]);

  const deselectAllBatches = useCallback(() => {
    setSelectedBatchIds([]);
  }, []);

  const buildFormData = useCallback((): FormData => {
    const formData = new FormData();
    const farmIdToSend = resolvedFarmId ?? initialFarmId;

    if (farmIdToSend) {
      formData.append('farm_id', String(farmIdToSend));
    }
    if (farmCode.trim()) {
      formData.append('farm_code', farmCode.trim());
    }
    selectedBatchIds.forEach((batchId, index) => {
      formData.append(`batch_ids[${index}]`, String(batchId));
    });

    const effectiveState = (stateName || state).trim();
    if (effectiveState) {
      formData.append('state', effectiveState);
      formData.append('state_name', effectiveState);
    }
    if (site.trim()) {
      formData.append('site', site.trim());
    }
    formData.append('date_of_mixing', dateOfMixing);
    if (latitude != null) {
      formData.append('latitude', String(latitude));
      formData.append('gps_latitude', String(latitude));
    }
    if (longitude != null) {
      formData.append('longitude', String(longitude));
      formData.append('gps_longitude', String(longitude));
    }
    if (altitude != null) {
      formData.append('altitude', String(altitude));
    }
    if (accuracyM != null) {
      formData.append('gps_accuracy', String(accuracyM));
    }
    if (gpsCapturedAt) {
      formData.append('captured_at', gpsCapturedAt);
      formData.append('location_captured_at', gpsCapturedAt);
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
    if (farmerName.trim()) {
      formData.append('farmer_name', farmerName.trim());
    }
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    for (const [key, asset] of Object.entries(evidence) as Array<[BiocharMixingEvidenceKey, BiocharMixingEvidenceAsset]>) {
      if (!asset?.uri || asset.remoteUrl) {
        continue;
      }

      const apiField = BIOCHAR_MIXING_EVIDENCE_API_FIELD[key];
      formData.append(apiField, {
        uri: asset.uri,
        name: `${key}.jpg`,
        type: asset.isDocument ? 'application/pdf' : 'image/jpeg',
      } as unknown as Blob);

      if (!asset.isDocument) {
        formData.append('evidence_pre_stamped', '1');
        if (asset.capturedAt) {
          formData.append('captured_at', asset.capturedAt);
        }
        if (asset.latitude != null) {
          formData.append('gps_latitude', String(asset.latitude));
        }
        if (asset.longitude != null) {
          formData.append('gps_longitude', String(asset.longitude));
        }
        if (asset.accuracy != null) {
          formData.append('gps_accuracy', String(asset.accuracy));
        }
      }
    }

    return formData;
  }, [
    accuracyM,
    altitude,
    dateOfMixing,
    districtName,
    evidence,
    farmCode,
    farmerName,
    gpsCapturedAt,
    initialFarmId,
    latitude,
    longitude,
    notes,
    resolvedFarmId,
    selectedBatchIds,
    site,
    state,
    stateName,
    talukaName,
    villageName,
  ]);

  const submit = useCallback(async (): Promise<BiocharMixingSubmitResult | null> => {
    setSubmitting(true);
    setError(null);

    try {
      if (locationStatus === 'out_of_zone') {
        throw new Error('Out of Zone');
      }
      if (!(resolvedFarmId ?? initialFarmId)) {
        throw new Error('Required Farm or Batch information is missing.');
      }
      if (!farmerName.trim()) {
        throw new Error('Farmer name is required.');
      }
      if (!(stateName || state).trim()) {
        throw new Error('Capture current location so state can be filled before submit.');
      }
      if (latitude == null || longitude == null) {
        throw new Error('Capture mixing location GPS before submit.');
      }
      if (selectedBatchIds.length === 0) {
        throw new Error('Select at least one approved Biochar Production Batch before submit.');
      }

      const formData = buildFormData();
      const response = (
        isArtisanMode
          ? await completeArtisanBiocharMixing(formData)
          : isOfficerMode
            ? await completeOfficerFarmerBiocharMixing(farmerId ?? resolvedFarmerId ?? 0, formData)
            : await completeFarmerBiocharMixing(formData)
      ) as ApiRecord;

      const record = (response.mixing ?? response.record ?? response) as ApiRecord;
      applyRecord(record);

      const mixingId = Number(record.id ?? record.mixing_id ?? 0);
      const mixingCode =
        pickString(record, 'mixing_record_id', 'mixing_code', 'mixingCode') !== '-'
          ? pickString(record, 'mixing_record_id', 'mixing_code', 'mixingCode')
          : String(mixingId);
      const resolvedSelectedBatchIds = mapSelectedBatchIds(record);

      return {
        mixingCode,
        mixingId,
        farmId: Number(record.farm_id ?? resolvedFarmId ?? initialFarmId ?? 0) || null,
        farmCode:
          pickString(record, 'farm_code', 'farmCode') !== '-'
            ? pickString(record, 'farm_code', 'farmCode')
            : farmCode,
        farmerId: Number(record.farmer_id ?? resolvedFarmerId ?? farmerId ?? 0) || null,
        farmerCode:
          pickString(record, 'farmer_code', 'farmerCode') !== '-'
            ? pickString(record, 'farmer_code', 'farmerCode')
            : farmerCode,
        farmerName:
          pickString(record, 'farmer_name', 'farmerName') !== '-'
            ? pickString(record, 'farmer_name', 'farmerName')
            : farmerName,
        selectedBatchIds: resolvedSelectedBatchIds.length > 0 ? resolvedSelectedBatchIds : selectedBatchIds,
        village: villageName || undefined,
        taluka: talukaName || undefined,
        district: districtName || undefined,
        state: (stateName || state) || undefined,
        biocharApplicationRouteReady: Boolean(record.biochar_application_route_ready ?? true),
        hasBiocharApplication: Boolean(record.has_biochar_application),
        linkedApplicationId:
          record.linked_application_id != null ? Number(record.linked_application_id) : null,
      };
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to submit Biochar Mixing.');
      if (isOutOfZoneMessage(message) || message === 'Out of Zone') {
        setLocationStatus('out_of_zone');
        setError('Out of Zone');
        Alert.alert('Out of Zone', 'This location is outside your assigned working area.');
      } else {
        setError(message);
        Alert.alert('Submit failed', message);
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [
    applyRecord,
    buildFormData,
    districtName,
    farmCode,
    farmerCode,
    farmerId,
    farmerName,
    initialFarmId,
    isArtisanMode,
    isOfficerMode,
    latitude,
    locationStatus,
    longitude,
    resolvedFarmId,
    resolvedFarmerId,
    selectedBatchIds,
    state,
    stateName,
    talukaName,
    villageName,
  ]);

  return {
    loading,
    submitting,
    capturingGps,
    error,
    recordId,
    mixingRecordId,
    statusLabel,
    heroMeta,
    canEdit,
    canSubmit,
    site,
    setSite,
    dateOfMixing,
    latitude,
    longitude,
    altitude,
    accuracyM,
    gpsAccuracyTier,
    gpsCapturedAt,
    villageName,
    talukaName,
    districtName,
    stateName,
    locationStatus,
    farmerName,
    farmerCode,
    farmName,
    farmCode,
    resolvedFarmId,
    resolvedFarmerId,
    selectedBatchIds,
    toggleBatchSelection,
    selectAllBatches,
    deselectAllBatches,
    selectedBatchCount,
    combinedSelectedQuantity,
    batches,
    loadingBatches,
    batchesError,
    batchesEmptyMessage,
    refreshBatches: () => {
      if (resolvedFarmId) {
        void loadEligibleBatches(resolvedFarmId, farmerId);
      }
    },
    notes,
    setNotes,
    evidence,
    recaptureGps,
    addEvidence,
    removeEvidence,
    biocharApplicationRouteReady,
    hasBiocharApplication,
    linkedApplicationId,
    submit,
    reload: loadInitialData,
  };
}
