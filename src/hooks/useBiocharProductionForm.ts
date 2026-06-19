import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  createOfficerBiocharBatch,
  getBiocharBatchPreviewCodes,
  getBiocharProductionUnits,
  getFieldOfficerFarmers,
  getFieldOfficerProfile,
} from '../api/fieldOfficerApi';
import {
  type BiocharEvidenceKey,
  type BiocharOutputUnit,
  type BiocharVerificationResult,
} from '../constants/biocharProduction';
import { DEFAULT_FEEDSTOCK_TYPE, DEFAULT_FEEDSTOCK_QUANTITY_UNIT } from '../constants/feedstockTypes';
import type { BiocharEvidenceAsset } from '../components/officer/biochar/BiocharProductionSections';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { mapProductionUnit, type ProductionUnitOption } from '../utils/biocharProductionHelpers';

interface UseBiocharProductionFormOptions {
  farmerId?: number;
}

export function useBiocharProductionForm({ farmerId }: UseBiocharProductionFormOptions = {}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [officerName, setOfficerName] = useState('Field Officer');
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | null>(farmerId ?? null);

  const [productionRecordCode, setProductionRecordCode] = useState('BPR-2026-00045');
  const [batchCode, setBatchCode] = useState('BCH-2026-00012');
  const [units, setUnits] = useState<ProductionUnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [operatorName, setOperatorName] = useState('Mahesh Patel');
  const [latitude, setLatitude] = useState<number | null>(22.5726);
  const [longitude, setLongitude] = useState<number | null>(88.3639);
  const [accuracyM, setAccuracyM] = useState<number | null>(3.2);

  const [feedstockQuantity, setFeedstockQuantity] = useState('');
  const [feedstockUnit, setFeedstockUnit] = useState(DEFAULT_FEEDSTOCK_QUANTITY_UNIT);
  const [feedstockType, setFeedstockType] = useState(DEFAULT_FEEDSTOCK_TYPE);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:30');
  const [temperature, setTemperature] = useState('');
  const [residenceTime, setResidenceTime] = useState('');
  const [biocharOutput, setBiocharOutput] = useState('');
  const [biocharOutputUnit, setBiocharOutputUnit] = useState<BiocharOutputUnit>('kg');
  const [officerNotes, setOfficerNotes] = useState('');
  const [verificationResult, setVerificationResult] = useState<BiocharVerificationResult>('draft');
  const [evidence, setEvidence] = useState<Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>>({});

  const statusLabel = useMemo(() => {
    if (verificationResult === 'draft') {
      return 'Draft';
    }
    if (verificationResult === 'review') {
      return 'Submitted for Review';
    }
    if (verificationResult === 'completed') {
      return 'Completed';
    }
    return 'Correction Required';
  }, [verificationResult]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileData, unitsData, codesData, farmersData] = await Promise.all([
        getFieldOfficerProfile(),
        getBiocharProductionUnits(),
        getBiocharBatchPreviewCodes(),
        farmerId ? Promise.resolve(null) : getFieldOfficerFarmers(),
      ]);

      const user = (profileData.user ?? profileData) as ApiRecord;
      const name = pickString(user, 'name');
      if (name !== '-') {
        setOfficerName(name);
      }

      const mappedUnits = extractList(unitsData as ApiRecord, ['production_units']).map(mapProductionUnit);
      setUnits(mappedUnits);
      if (mappedUnits[0]) {
        setSelectedUnitId(mappedUnits[0].id);
        if (mappedUnits[0].operatorName) {
          setOperatorName(mappedUnits[0].operatorName);
        }
      }

      const codes = (codesData.codes ?? codesData) as ApiRecord;
      const nextRecordCode = pickString(codes, 'production_record_code', 'productionRecordCode');
      const nextBatchCode = pickString(codes, 'batch_code', 'batchCode');
      if (nextRecordCode !== '-') {
        setProductionRecordCode(nextRecordCode);
      }
      if (nextBatchCode !== '-') {
        setBatchCode(nextBatchCode);
      }

      if (!farmerId && farmersData) {
        const farmers = extractList(farmersData as ApiRecord, ['farmers']);
        const firstFarmer = farmers[0];
        if (firstFarmer?.id) {
          setSelectedFarmerId(Number(firstFarmer.id));
        }
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load biochar production form.'));
    } finally {
      setLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const regenerateCodes = useCallback(async () => {
    try {
      const codesData = await getBiocharBatchPreviewCodes();
      const codes = (codesData.codes ?? codesData) as ApiRecord;
      const nextRecordCode = pickString(codes, 'production_record_code', 'productionRecordCode');
      const nextBatchCode = pickString(codes, 'batch_code', 'batchCode');
      if (nextRecordCode !== '-') {
        setProductionRecordCode(nextRecordCode);
      }
      if (nextBatchCode !== '-') {
        setBatchCode(nextBatchCode);
      }
    } catch (codeError) {
      Alert.alert('Unable to generate codes', getApiErrorMessage(codeError, 'Try again in a moment.'));
    }
  }, []);

  const recaptureGps = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location permission required', 'Enable location access to capture production GPS.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLatitude(position.coords.latitude);
    setLongitude(position.coords.longitude);
    setAccuracyM(position.coords.accuracy ?? null);
  }, []);

  const selectUnit = useCallback(
    (unitId: number) => {
      setSelectedUnitId(unitId);
      const unit = units.find((item) => item.id === unitId);
      if (unit?.operatorName) {
        setOperatorName(unit.operatorName);
      }
    },
    [units],
  );

  const addEvidence = useCallback(async (key: BiocharEvidenceKey) => {
    const slot = key === 'production_video' ? 'video' : 'photo';
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Enable camera access to capture production evidence.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: slot === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
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
        name: asset.fileName ?? `${key}.${slot === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: asset.mimeType,
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

  const buildFormData = useCallback(
    (resultOverride?: BiocharVerificationResult): FormData => {
    if (!selectedFarmerId) {
      throw new Error('Select a farmer before submitting this production record.');
    }

    const formData = new FormData();
    formData.append('farmer_id', String(selectedFarmerId));

    if (selectedUnitId) {
      formData.append('production_unit_id', String(selectedUnitId));
    }
    if (operatorName.trim()) {
      formData.append('operator_name', operatorName.trim());
    }
    if (feedstockType) {
      formData.append('feedstock_type', feedstockType);
    }
    if (feedstockQuantity.trim()) {
      formData.append('feedstock_quantity', feedstockQuantity.trim());
    }
    formData.append('feedstock_unit', feedstockUnit);
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
    if (officerNotes.trim()) {
      formData.append('officer_notes', officerNotes.trim());
    }
    formData.append('verification_result', resultOverride ?? verificationResult);

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

    appendAsset('production_photo', evidence.kiln_setup);
    appendAsset('production_video', evidence.production_video);
    appendAsset('batch_output_photo', evidence.batch_output);
    appendAsset('operator_photo', evidence.operator_photo);

    return formData;
  },
    [
    accuracyM,
    biocharOutput,
    biocharOutputUnit,
    endTime,
    evidence,
    feedstockQuantity,
    feedstockType,
    feedstockUnit,
    latitude,
    longitude,
    officerNotes,
    operatorName,
    residenceTime,
    selectedFarmerId,
    selectedUnitId,
    startTime,
    temperature,
    verificationResult,
  ],
  );

  const submit = useCallback(
    async (resultOverride?: BiocharVerificationResult): Promise<string | null> => {
      setSubmitting(true);
      setError(null);

      const result = resultOverride ?? verificationResult;

      try {
        if (!selectedFarmerId) {
          throw new Error('No assigned farmer found for this production record.');
        }

        if (result !== 'draft' && (!feedstockQuantity.trim() || !biocharOutput.trim())) {
          throw new Error('Enter feedstock quantity and biochar output before submitting.');
        }

        const response = (await createOfficerBiocharBatch(buildFormData(result))) as ApiRecord;
        const batch = (response.batch ?? response) as ApiRecord;
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
    },
    [batchCode, biocharOutput, buildFormData, feedstockQuantity, selectedFarmerId, verificationResult],
  );

  const saveDraft = useCallback(async (): Promise<boolean> => {
    const code = await submit('draft');
    return code != null;
  }, [submit]);

  return {
    loading,
    submitting,
    error,
    officerName,
    productionRecordCode,
    batchCode,
    statusLabel,
    units,
    selectedUnitId,
    operatorName,
    latitude,
    longitude,
    accuracyM,
    feedstockQuantity,
    feedstockUnit,
    feedstockType,
    startTime,
    endTime,
    temperature,
    residenceTime,
    biocharOutput,
    biocharOutputUnit,
    officerNotes,
    verificationResult,
    evidence,
    gpsCaptured: latitude != null && longitude != null,
    setFeedstockQuantity,
    setFeedstockUnit,
    setFeedstockType,
    setStartTime,
    setEndTime,
    setTemperature,
    setResidenceTime,
    setBiocharOutput,
    setBiocharOutputUnit,
    setOfficerNotes,
    setVerificationResult,
    setOperatorName,
    selectUnit,
    regenerateCodes,
    recaptureGps,
    addEvidence,
    removeEvidence,
    submit,
    saveDraft,
    reload: loadInitialData,
  };
}
