import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  createOfficerBiocharBatch,
  getBiocharProductionUnits,
  getFieldOfficerBiocharBatch,
  getFieldOfficerFarmers,
  getFieldOfficerProfile,
  saveFieldOfficerBiocharBatchDraft,
  submitFieldOfficerBiocharBatch,
  updateFieldOfficerBiocharBatch,
} from '../api/fieldOfficerApi';
import {
  createFarmerBiocharActivity,
  getFarmerBiocharActivity,
  getFarmerProfile,
  saveFarmerBiocharActivityDraft,
  submitFarmerBiocharActivity,
} from '../api/farmerApi';
import {
  createArtisanBiocharProduction,
  getArtisanBiocharProduction,
  getArtisanProfile,
  saveArtisanBiocharProductionDraft,
  submitArtisanBiocharProduction,
} from '../api/artisanApi';
import { BIOCHAR_EVIDENCE_API_FIELD, type BiocharEvidenceKey } from '../constants/biocharProduction';
import { DEFAULT_FEEDSTOCK_TYPE, DEFAULT_FEEDSTOCK_QUANTITY_UNIT } from '../constants/feedstockTypes';
import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { mapProductionUnit, type ProductionUnitOption } from '../utils/biocharProductionHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { captureLivePhotoEvidence, pickStampedPhotoEvidence } from '../utils/liveEvidenceCapture';
import { buildGoogleMapsUrl, captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { resolveCaptureLocation } from '../utils/livePhotoLocation';

interface UseBiocharProductionFormOptions {
  farmerId?: number;
  farmId?: number;
  batchId?: number;
  apiMode?: 'officer' | 'farmer' | 'artisan';
  behalfReason?: string;
}

export interface BiocharMoistureReadingDraft {
  key: string;
  moistureReading: string;
  notes: string;
  photo?: BiocharEvidenceAsset;
}

function createMoistureReadingDraft(seed = 0): BiocharMoistureReadingDraft {
  return {
    key: `reading-${Date.now()}-${seed}-${Math.random().toString(16).slice(2)}`,
    moistureReading: '',
    notes: '',
  };
}

function createDefaultMoistureReadings(): BiocharMoistureReadingDraft[] {
  return Array.from({ length: 5 }, (_, index) => createMoistureReadingDraft(index));
}

function currentTimeValue(): string {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function hydrateBatch(batch: ApiRecord) {
  const kilnId = pickString(batch, 'kiln_id', 'kilnId');
  const farmerName = pickString(batch, 'farmer_name', 'farmerName');
  const moistureReadings = extractList(batch, ['moisture_readings']).map((reading, index) => ({
    key: `reading-${batch.id}-${index}`,
    moistureReading: pickString(reading, 'moisture_reading', 'moistureReading'),
    notes: pickString(reading, 'notes'),
    photo: reading.stamped_photo_path || reading.original_photo_path || reading.moisture_photo_path
      ? {
          uri: pickString(reading, 'stamped_photo_path', 'original_photo_path', 'moisture_photo_path'),
          name: pickString(reading, 'stamped_photo_path', 'original_photo_path', 'moisture_photo_path'),
        }
      : undefined,
  }));

  return {
    batchId: Number(batch.id),
    productionRecordCode: pickString(batch, 'production_record_code', 'productionRecordCode'),
    batchCode: pickString(batch, 'batch_code', 'batchCode'),
    selectedFarmerId: batch.farmer_id != null ? Number(batch.farmer_id) : null,
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
    moistureValue: batch.moisture_value != null ? String(batch.moisture_value) : '',
    moistureNotes: pickString(batch, 'moisture_notes', 'moistureNotes'),
    startTime: pickString(batch, 'start_time', 'startTime') || '08:00',
    endTime: pickString(batch, 'end_time', 'endTime') || '12:30',
    temperature: batch.temperature != null ? String(batch.temperature) : '',
    residenceTime: pickString(batch, 'residence_time', 'residenceTime'),
    biocharOutput: batch.biochar_output != null ? String(batch.biochar_output) : '',
    biocharOutputUnit: (pickString(batch, 'biochar_output_unit', 'biocharOutputUnit') || 'kg') as 'kg' | 'ton',
    latitude: batch.gps_latitude != null ? Number(batch.gps_latitude) : null,
    longitude: batch.gps_longitude != null ? Number(batch.gps_longitude) : null,
    accuracyM: batch.gps_accuracy != null ? Number(batch.gps_accuracy) : null,
    altitude: batch.altitude != null ? Number(batch.altitude) : null,
    timestampDate:
      pickString(batch, 'timestamp_date', 'timestampDate') !== '-'
        ? pickString(batch, 'timestamp_date', 'timestampDate').slice(0, 10)
        : todayIsoDate(),
    timestampTime: pickString(batch, 'timestamp_time', 'timestampTime') || currentTimeValue(),
    finalStageTime: pickString(batch, 'final_stage_time', 'finalStageTime') || '',
    quenchingTime: pickString(batch, 'quenching_time', 'quenchingTime') || '',
    villageName: pickString(batch, 'village_name', 'villageName'),
    talukaName: pickString(batch, 'taluka_name', 'talukaName'),
    districtName: pickString(batch, 'district_name', 'districtName'),
    stateName: pickString(batch, 'state_name', 'stateName'),
    officerNotes: pickString(batch, 'officer_notes', 'officerNotes'),
    moistureReadings,
    canEdit: batch.can_edit !== false,
    canSubmit: batch.can_submit !== false,
    status: pickString(batch, 'status'),
  };
}

export function useBiocharProductionForm({
  farmerId,
  farmId,
  batchId: initialBatchId,
  apiMode = 'officer',
  behalfReason,
}: UseBiocharProductionFormOptions = {}) {
  const isFarmerMode = apiMode === 'farmer';
  const isArtisanMode = apiMode === 'artisan';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState('Field Officer');
  const [batchId, setBatchId] = useState<number | null>(initialBatchId ?? null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(farmerId ?? null);
  const [canEdit, setCanEdit] = useState(true);
  const [canSubmit, setCanSubmit] = useState(true);

  const [productionRecordCode, setProductionRecordCode] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [units, setUnits] = useState<ProductionUnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [kilnId, setKilnId] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [productionDate, setProductionDate] = useState(todayIsoDate());
  const [operatorName, setOperatorName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
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
  const [moistureValue, setMoistureValue] = useState('');
  const [moistureNotes, setMoistureNotes] = useState('');
  const [moistureReadings, setMoistureReadings] = useState<BiocharMoistureReadingDraft[]>(createDefaultMoistureReadings);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:30');
  const [temperature, setTemperature] = useState('');
  const [residenceTime, setResidenceTime] = useState('');
  const [biocharOutput, setBiocharOutput] = useState('');
  const [biocharOutputUnit, setBiocharOutputUnit] = useState<'kg' | 'ton'>('kg');
  const [officerNotes, setOfficerNotes] = useState('');
  const [recordStatus, setRecordStatus] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>>({});

  const statusLabel = useMemo(() => {
    if (recordStatus === 'draft') {
      return 'Draft';
    }

    if (recordStatus === 'submitted_for_review') {
      return 'Submitted';
    }

    if (recordStatus === 'completed') {
      return 'Completed';
    }

    if (recordStatus === 'correction_required') {
      return 'Correction Required';
    }

    return recordStatus ? recordStatus.replace(/_/g, ' ') : null;
  }, [recordStatus]);

  const applyBatch = useCallback((batch: ApiRecord) => {
    const hydrated = hydrateBatch(batch);
    setBatchId(hydrated.batchId);
    setProductionRecordCode(hydrated.productionRecordCode !== '-' ? hydrated.productionRecordCode : '');
    setBatchCode(hydrated.batchCode !== '-' ? hydrated.batchCode : '');
    if (hydrated.selectedFarmerId) {
      setSelectedFarmerId(hydrated.selectedFarmerId);
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
    setMoistureValue(hydrated.moistureValue);
    setMoistureNotes(hydrated.moistureNotes !== '-' ? hydrated.moistureNotes : '');
    setStartTime(hydrated.startTime);
    setEndTime(hydrated.endTime);
    setTemperature(hydrated.temperature);
    setResidenceTime(hydrated.residenceTime !== '-' ? hydrated.residenceTime : '');
    setBiocharOutput(hydrated.biocharOutput);
    setBiocharOutputUnit(hydrated.biocharOutputUnit);
    setLatitude(hydrated.latitude);
    setLongitude(hydrated.longitude);
    setAccuracyM(hydrated.accuracyM);
    setAltitude(hydrated.altitude);
    setTimestampDate(hydrated.timestampDate);
    setTimestampTime(hydrated.timestampTime);
    setFinalStageTime(hydrated.finalStageTime);
    setQuenchingTime(hydrated.quenchingTime);
    setVillageName(hydrated.villageName !== '-' ? hydrated.villageName : '');
    setTalukaName(hydrated.talukaName !== '-' ? hydrated.talukaName : '');
    setDistrictName(hydrated.districtName !== '-' ? hydrated.districtName : '');
    setStateName(hydrated.stateName !== '-' ? hydrated.stateName : '');
    setMoistureReadings(
      hydrated.moistureReadings.length > 0 ? hydrated.moistureReadings : createDefaultMoistureReadings(),
    );
    setOfficerNotes(hydrated.officerNotes !== '-' ? hydrated.officerNotes : '');
    setCanEdit(hydrated.canEdit);
    setCanSubmit(hydrated.canSubmit);
    setRecordStatus(hydrated.status !== '-' ? hydrated.status : null);
  }, [feedstockType, feedstockUnit]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isArtisanMode) {
        const requests: Promise<unknown>[] = [getArtisanProfile()];

        if (initialBatchId) {
          requests.push(getArtisanBiocharProduction(initialBatchId));
        }

        const results = await Promise.all(requests);
        const profileData = results[0] as ApiRecord;
        const artisan = (profileData.artisan ?? profileData) as ApiRecord;
        const name = pickString(artisan, 'name');

        if (name !== '-') {
          setOfficerName(name);
          if (!operatorName) {
            setOperatorName(name);
          }
        }

        if (initialBatchId && results[1]) {
          const batchData = results[1] as ApiRecord;
          const batch = (batchData.batch ?? batchData.record ?? batchData) as ApiRecord;
          applyBatch(batch);
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
          const name = pickString(profile, 'name', 'farmer_name');
          if (name !== '-') {
            setOfficerName(name);
            setFarmerName(name);
            if (!operatorName) {
              setOperatorName(name);
            }
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
      ];

      if (initialBatchId) {
        requests.push(getFieldOfficerBiocharBatch(initialBatchId));
      } else {
        if (!farmerId) {
          requests.push(getFieldOfficerFarmers());
        }
      }

      const results = await Promise.all(requests);
      const profileData = results[0] as ApiRecord;
      const unitsData = results[1] as ApiRecord;

      const user = (profileData.user ?? profileData) as ApiRecord;
      const name = pickString(user, 'name');
      if (name !== '-') {
        setOfficerName(name);
      }

      const mappedUnits = extractList(unitsData as ApiRecord, ['production_units']).map(mapProductionUnit);
      setUnits(mappedUnits);

      if (initialBatchId) {
        const batchData = results[2] as ApiRecord;
        const batch = (batchData.batch ?? batchData) as ApiRecord;
        applyBatch(batch);
      } else {
        if (!farmerId && results[2]) {
          const farmersData = results[2] as ApiRecord;
          const farmers = extractList(farmersData as ApiRecord, ['farmers']);
          const firstFarmer = farmers[0];
          if (firstFarmer?.id) {
            setSelectedFarmerId(Number(firstFarmer.id));
            const nextFarmerName = pickString(firstFarmer, 'name', 'farmer_name');
            if (nextFarmerName !== '-') {
              setFarmerName(nextFarmerName);
            }
          }
        }

        if (mappedUnits[0] && !selectedUnitId && !kilnId) {
          setSelectedUnitId(mappedUnits[0].id);
          setKilnId(mappedUnits[0].kilnId || mappedUnits[0].label);
          if (mappedUnits[0].operatorName && !operatorName) {
            setOperatorName(mappedUnits[0].operatorName);
          }
        }
      }

      if (!isFarmerMode && !isArtisanMode && farmerId) {
        try {
          const farmersData = await getFieldOfficerFarmers();
          const farmers = extractList(farmersData as ApiRecord, ['farmers']);
          const selectedFarmer = farmers.find((item) => Number(item.id) === farmerId);
          const nextFarmerName = pickString(selectedFarmer ?? {}, 'name', 'farmer_name');
          if (nextFarmerName !== '-') {
            setFarmerName(nextFarmerName);
          }
        } catch {
          // Farmer name is optional for display.
        }
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load biochar production form.'));
    } finally {
      setLoading(false);
    }
  }, [applyBatch, farmerId, initialBatchId, isArtisanMode, isFarmerMode, operatorName]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const regenerateCodes = useCallback(async () => {
    const datePart = (productionDate || todayIsoDate()).replace(/-/g, '');
    const farmerPart = selectedFarmerId ? `FRM${String(selectedFarmerId).padStart(3, '0')}` : null;
    const sequencePart = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');

    setBatchCode(['BIO', farmerPart, datePart, sequencePart].filter(Boolean).join('-'));
  }, [productionDate, selectedFarmerId]);

  const recaptureGps = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location permission required', 'Enable location access to capture production GPS.');
      return;
    }

    try {
      const position = await captureHighAccuracyGps();
      setLatitude(position.latitude);
      setLongitude(position.longitude);
      setAccuracyM(position.accuracyM);
      setAltitude(position.altitude);
      const location = await resolveCaptureLocation(position.latitude, position.longitude);

      setVillageName((current) => current.trim() || (location.village !== '-' ? location.village : 'Not Available'));
      setTalukaName((current) => current.trim() || (location.taluka !== '-' ? location.taluka : 'Not Available'));
      setDistrictName((current) => current.trim() || (location.district !== '-' ? location.district : 'Not Available'));
      setStateName((current) => current.trim() || (location.state !== '-' ? location.state : 'Gujarat'));
    } catch (gpsError) {
      Alert.alert('GPS capture failed', getApiErrorMessage(gpsError, 'Unable to capture GPS location.'));
    }
  }, []);

  const syncGpsFromCapture = useCallback(async (nextLatitude: number, nextLongitude: number, nextAccuracy: number | null) => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    setAccuracyM(nextAccuracy);
  }, []);

  const syncAltitudeFromCapture = useCallback(async (nextAltitude: number | null) => {
    setAltitude(nextAltitude);
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
      setKilnId(value);
      const normalized = value.trim().toLowerCase();
      const matchedUnit = units.find((unit) => {
        const kilnMatch = unit.kilnId.trim().toLowerCase() === normalized;
        const labelMatch = unit.label.trim().toLowerCase() === normalized;
        return kilnMatch || labelMatch;
      });
      setSelectedUnitId(matchedUnit?.id ?? null);
    },
    [units],
  );

  const addMoistureReading = useCallback(() => {
    setMoistureReadings((current) => [...current, createMoistureReadingDraft(current.length)]);
  }, []);

  const updateMoistureReading = useCallback((key: string, field: 'moistureReading' | 'notes', value: string) => {
    setMoistureReadings((current) =>
      current.map((reading) => (reading.key === key ? { ...reading, [field]: value } : reading)),
    );
  }, []);

  const updateMoistureReadingPhoto = useCallback((key: string, asset?: BiocharEvidenceAsset) => {
    setMoistureReadings((current) =>
      current.map((reading) => (reading.key === key ? { ...reading, photo: asset } : reading)),
    );
  }, []);

  const removeMoistureReading = useCallback((key: string) => {
    setMoistureReadings((current) => {
      const next = current.filter((reading) => reading.key !== key);
      return next.length > 0 ? next : [createMoistureReadingDraft()];
    });
  }, []);

  const captureMoistureReadingPhoto = useCallback(async (key: string) => {
    const result = await captureLivePhotoEvidence({
      defaultName: `moisture-reading-${key}.jpg`,
      allowsEditing: true,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Capture failed', result.error);
      }

      return;
    }

    updateMoistureReadingPhoto(key, {
      uri: result.evidence.uri,
      name: result.evidence.name,
      mimeType: result.evidence.type,
      capturedAt: result.evidence.capturedAt,
      latitude: result.evidence.latitude,
      longitude: result.evidence.longitude,
      accuracy: result.evidence.accuracy,
    });
  }, [updateMoistureReadingPhoto]);

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

    updateMoistureReadingPhoto(key, {
      uri: result.evidence.uri,
      name: result.evidence.name,
      mimeType: result.evidence.type,
      capturedAt: result.evidence.capturedAt,
      latitude: result.evidence.latitude,
      longitude: result.evidence.longitude,
      accuracy: result.evidence.accuracy,
    });
  }, [updateMoistureReadingPhoto]);

  const addEvidence = useCallback(async (key: BiocharEvidenceKey) => {
    const isVideo = key === 'process_video';

    if (isVideo) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera permission required', 'Enable camera access to capture production evidence.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      setEvidence((current) => ({
        ...current,
        [key]: {
          uri: asset.uri,
          name: asset.fileName ?? `${key}.mp4`,
          mimeType: asset.mimeType,
        },
      }));

      return;
    }

    const result = await captureLivePhotoEvidence({
      defaultName: `${key}.jpg`,
      allowsEditing: true,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Capture failed', result.error);
      }

      return;
    }

    setEvidence((current) => ({
      ...current,
      [key]: {
        uri: result.evidence.uri,
        name: result.evidence.name,
        mimeType: result.evidence.type,
        capturedAt: result.evidence.capturedAt,
        latitude: result.evidence.latitude,
        longitude: result.evidence.longitude,
        accuracy: result.evidence.accuracy,
      },
    }));
  }, []);

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

    setEvidence((current) => ({
      ...current,
      [key]: {
        uri: result.evidence.uri,
        name: result.evidence.name,
        mimeType: result.evidence.type,
        capturedAt: result.evidence.capturedAt,
        latitude: result.evidence.latitude,
        longitude: result.evidence.longitude,
        accuracy: result.evidence.accuracy,
      },
    }));
  }, []);

  const removeEvidence = useCallback((key: BiocharEvidenceKey) => {
    setEvidence((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const buildFormData = useCallback((): FormData => {
    if (!isFarmerMode && !selectedFarmerId) {
      throw new Error('Select a farmer before saving this production record.');
    }

    const formData = new FormData();

    if (!isFarmerMode && !isArtisanMode && selectedFarmerId) {
      formData.append('farmer_id', String(selectedFarmerId));
    }

    if (isArtisanMode && farmId) {
      formData.append('farm_id', String(farmId));
    }

    if (behalfReason?.trim()) {
      formData.append('behalf_reason', behalfReason.trim());
      formData.append('source', 'field_officer_app');
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

    if (timestampTime.trim()) {
      formData.append('timestamp_time', timestampTime.trim());
    }

    if (selectedUnitId) {
      formData.append('production_unit_id', String(selectedUnitId));
    } else if (kilnId.trim()) {
      formData.append('kiln_id', kilnId.trim());
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
    if (moistureValue.trim()) {
      formData.append('moisture_value', moistureValue.trim());
    }
    if (moistureNotes.trim()) {
      formData.append('moisture_notes', moistureNotes.trim());
    }
    if (startTime.trim()) {
      formData.append('start_time', startTime.trim());
    }
    if (endTime.trim()) {
      formData.append('end_time', endTime.trim());
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
    }
    if (longitude != null) {
      formData.append('gps_longitude', String(longitude));
    }
    if (accuracyM != null) {
      formData.append('gps_accuracy', String(accuracyM));
    }
    if (altitude != null) {
      formData.append('altitude', String(altitude));
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
    if (finalStageTime.trim()) {
      formData.append('final_stage_time', finalStageTime.trim());
    }
    if (quenchingTime.trim()) {
      formData.append('quenching_time', quenchingTime.trim());
    }
    if (officerNotes.trim()) {
      formData.append('officer_notes', officerNotes.trim());
    }

    const normalizedMoistureReadings = moistureReadings.filter(
      (reading) => reading.moistureReading.trim() || reading.notes.trim() || reading.photo,
    );
    if (normalizedMoistureReadings.length > 0) {
      normalizedMoistureReadings.forEach((reading, index) => {
        formData.append(`moisture_readings[${index}][moisture_reading]`, reading.moistureReading.trim());
        if (reading.notes.trim()) {
          formData.append(`moisture_readings[${index}][notes]`, reading.notes.trim());
        }
        if (reading.photo) {
          formData.append(`moisture_readings[${index}][moisture_photo]`, {
            uri: reading.photo.uri,
            name: reading.photo.name,
            type: reading.photo.mimeType ?? 'application/octet-stream',
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
      .filter((asset): asset is BiocharEvidenceAsset => Boolean(asset?.capturedAt));

    if (imageEvidence.length > 0) {
      formData.append('evidence_pre_stamped', '1');

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
      if (!asset) {
        return;
      }

      formData.append(field, {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
      } as unknown as Blob);
    };

    (Object.keys(BIOCHAR_EVIDENCE_API_FIELD) as BiocharEvidenceKey[]).forEach((key) => {
      appendAsset(BIOCHAR_EVIDENCE_API_FIELD[key], evidence[key]);
    });

    return formData;
  }, [
    accuracyM,
    behalfReason,
    batchCode,
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
    kilnId,
    latitude,
    longitude,
    moistureNotes,
    moistureValue,
    moistureReadings,
    officerNotes,
    operatorName,
    productionDate,
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

      const response = (await createFarmerBiocharActivity(formData)) as ApiRecord;
      const batch = (response.batch ?? response.activity ?? response) as ApiRecord;
      const createdId = Number(batch.id);
      applyBatch(batch);
      return createdId;
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

  const saveDraft = useCallback(async (): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      await persistDraft();
      return true;
    } catch (draftError) {
      const message = getApiErrorMessage(draftError, 'Unable to save biochar production draft.');
      setError(message);
      Alert.alert('Draft save failed', message);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [persistDraft]);

  const submit = useCallback(async (): Promise<string | null> => {
    setSubmitting(true);
    setError(null);

    try {
      if (!isArtisanMode && !isFarmerMode && !selectedFarmerId) {
        throw new Error('No assigned farmer found for this production record.');
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

      if (latitude == null || longitude == null) {
        throw new Error('GPS location is required before submit. Capture GPS and try again.');
      }

      const completedReadings = moistureReadings.filter((reading) => reading.moistureReading.trim());
      if (completedReadings.length < 5) {
        throw new Error('Enter all five moisture readings before submitting.');
      }

      const requiredEvidence: BiocharEvidenceKey[] = [
        'feedstock_photo',
        'moisture_image',
        'starting_pyrolysis_photo',
        'mid_stage_photo',
        'end_stage_before_quenching_photo',
        'quenching_photo',
        'biochar_unloaded_photo',
        'biochar_mixing_photo',
      ];

      const missingEvidence = requiredEvidence.find((key) => !evidence[key]);
      if (missingEvidence) {
        throw new Error('Capture or upload all required Biochar process images before submitting.');
      }

      if (!finalStageTime.trim()) {
        throw new Error('Enter final stage time before submitting.');
      }

      if (!quenchingTime.trim()) {
        throw new Error('Enter quenching time before submitting.');
      }

      const id = await persistDraft();
      const response = isArtisanMode
        ? ((await submitArtisanBiocharProduction(id)) as ApiRecord)
        : isFarmerMode
          ? ((await submitFarmerBiocharActivity(id)) as ApiRecord)
          : ((await submitFieldOfficerBiocharBatch(id)) as ApiRecord);
      const batch = (response.batch ?? response.activity ?? response) as ApiRecord;
      applyBatch(batch);
      const submittedBatchCode = pickString(batch, 'batch_code', 'batchCode');
      return submittedBatchCode !== '-' ? submittedBatchCode : batchCode;
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to submit biochar production record.');
      setError(message);
      Alert.alert('Submission failed', message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [applyBatch, batchCode, evidence, feedstockQuantity, feedstockType, finalStageTime, isArtisanMode, isFarmerMode, latitude, longitude, moistureReadings, persistDraft, quenchingTime, selectedFarmerId]);

  return {
    loading,
    submitting,
    error,
    officerName,
    batchId,
    selectedFarmerId,
    productionRecordCode,
    batchCode,
    farmerName,
    productionDate,
    statusLabel,
    canEdit,
    canSubmit,
    units,
    selectedUnitId,
    kilnId,
    operatorName,
    latitude,
    longitude,
    accuracyM,
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
    moistureValue,
    moistureNotes,
    moistureReadings,
    startTime,
    endTime,
    temperature,
    residenceTime,
    biocharOutput,
    biocharOutputUnit,
    officerNotes,
    evidence,
    mapPreviewUrl: latitude != null && longitude != null ? buildGoogleMapsUrl(latitude, longitude) : undefined,
    gpsCaptured: latitude != null && longitude != null,
    setFeedstockQuantity,
    setFeedstockUnit,
    setFeedstockType,
    setMoistureValue,
    setMoistureNotes,
    setStartTime,
    setEndTime,
    setTemperature,
    setResidenceTime,
    setBiocharOutput,
    setBiocharOutputUnit,
    setOfficerNotes,
    setOperatorName,
    setBatchCode,
    setProductionDate,
    setTimestampDate,
    setTimestampTime,
    setFinalStageTime,
    setQuenchingTime,
    setVillageName,
    setTalukaName,
    setDistrictName,
    setStateName,
    setAltitude,
    selectUnit,
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
    addEvidence,
    uploadEvidence,
    removeEvidence,
    submit,
    saveDraft,
    reload: loadInitialData,
  };
}
