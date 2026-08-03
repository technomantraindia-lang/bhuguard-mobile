import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { createFarmerActivityLog, createFarmerCarbonEstimate, getFarmerFarms } from '../api/farmerApi';
import { DEFAULT_ACTIVITY_TYPE } from '../constants/farmerActivityTypes';
import { DEFAULT_ACTIVITY_UNIT } from '../constants/farmerActivityUnits';
import { useLiveEvidenceCapture } from './useLiveEvidenceCapture';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import {
  calculateBiocharDmrv,
  validateBiocharDmrvInputs,
  type BiocharDmrvInputs,
} from '../utils/biocharDmrvEngine';
import { getFarmLocationLabel, mapFarmRecord } from '../utils/farmMapHelpers';
import { appendActivityEvidenceFields, type LiveCapturedEvidence } from '../utils/liveEvidenceCapture';
const ACTIVITY_DRAFT_KEY = 'bhuguard_activity_draft';

export interface SubmitActivityFarmOption {
  id: number;
  name: string;
  subtitle: string;
}

export type SubmitActivityEvidence = LiveCapturedEvidence;
export interface SubmitActivityDraft {
  farmId: number | null;
  activityType: string;
  activityDate: string;
  description: string;
  quantity: string;
  unit: string;
  biocharDmrv: BiocharDmrvInputs;
}

interface UseSubmitActivityFormOptions {
  initialFarmId?: number;
}

export function useSubmitActivityForm({ initialFarmId }: UseSubmitActivityFormOptions) {
  const [farms, setFarms] = useState<SubmitActivityFarmOption[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(initialFarmId ?? null);
  const [activityType, setActivityType] = useState(DEFAULT_ACTIVITY_TYPE);
  const [activityDate, setActivityDate] = useState(todayIsoDate());
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState(DEFAULT_ACTIVITY_UNIT);
  const [biocharDmrv, setBiocharDmrv] = useState<BiocharDmrvInputs>({
    feedstockQuantity: '',
    biocharYield: '',
    fixedCarbonPercent: '',
  });
  const liveEvidence = useLiveEvidenceCapture({
    defaultName: 'activity-evidence.jpg',
    allowsEditing: false,
    requireConfirm: true,
  });
  const [latitude, setLatitude] = useState<number | null>(null);  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setFormError] = useState<string | null>(null);

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const loadFarms = useCallback(async () => {
    setFarmsLoading(true);

    try {
      const data = await getFarmerFarms();
      const records = extractList(data as ApiRecord, ['farms']);
      const options = records
        .map((record) => {
          const farm = mapFarmRecord(record);

          return {
            id: farm.id,
            name: farm.name,
            subtitle: `${farm.areaLabel} • ${getFarmLocationLabel(record)}`,
          };
        })
        .filter((farm) => farm.id > 0);

      setFarms(options);

      if (initialFarmId && options.some((farm) => farm.id === initialFarmId)) {
        setSelectedFarmId(initialFarmId);
      } else {
        setSelectedFarmId((current) => current ?? (options.length === 1 ? options[0].id : null));
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to load farms.'));
    } finally {
      setFarmsLoading(false);
    }
  }, [initialFarmId]);

  const captureGps = useCallback(async () => {
    setGpsLoading(true);
    setFormError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setFormError('Location permission is required to capture farm GPS.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setAccuracy(position.coords.accuracy ?? null);
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to capture GPS location.'));
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const loadDraft = useCallback(async () => {
    const raw = await AsyncStorage.getItem(ACTIVITY_DRAFT_KEY);

    if (!raw) {
      return;
    }

    try {
      const draft = JSON.parse(raw) as SubmitActivityDraft;

      if (!initialFarmId && draft.farmId) {
        setSelectedFarmId(draft.farmId);
      }

      setActivityType(draft.activityType || DEFAULT_ACTIVITY_TYPE);
      setActivityDate(draft.activityDate || todayIsoDate());
      setDescription(draft.description ?? '');
      setQuantity(draft.quantity ?? '');
      setUnit(draft.unit || DEFAULT_ACTIVITY_UNIT);
      setBiocharDmrv(
        draft.biocharDmrv ?? {
          feedstockQuantity: '',
          biocharYield: '',
          fixedCarbonPercent: '',
        },
      );
    } catch {
      // Ignore invalid draft payloads.
    }
  }, [initialFarmId]);

  useEffect(() => {
    void loadFarms();
    void loadDraft();
    void captureGps();
  }, [captureGps, loadDraft, loadFarms]);

  const buildDraft = (): SubmitActivityDraft => ({
    farmId: selectedFarmId,
    activityType,
    activityDate,
    description,
    quantity,
    unit,
    biocharDmrv,
  });

  const validate = (): string | null => {
    if (!selectedFarmId) {
      return 'Please select a farm.';
    }

    if (!activityType) {
      return 'Please select an activity type.';
    }

    if (!activityDate) {
      return 'Please choose an activity date.';
    }

    if (activityType === 'biochar_application') {
      const biocharError = validateBiocharDmrvInputs(biocharDmrv);

      if (biocharError) {
        return biocharError;
      }
    }

    return null;
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();

    formData.append('farm_id', String(selectedFarmId));
    formData.append('activity_type', activityType);
    formData.append('activity_date', activityDate);

    if (description.trim()) {
      formData.append('description', description.trim());
    }

    if (quantity.trim()) {
      formData.append('quantity', quantity.trim());
    }

    if (unit) {
      formData.append('unit', unit);
    }

    if (liveEvidence.evidence) {
      appendActivityEvidenceFields(formData, liveEvidence.evidence);
    } else {
      if (latitude !== null) {
        formData.append('gps_latitude', String(latitude));
      }

      if (longitude !== null) {
        formData.append('gps_longitude', String(longitude));
      }

      if (accuracy !== null) {
        formData.append('gps_accuracy', String(accuracy));
      }
    }

    return formData;
  };
  const submitActivity = async (): Promise<boolean> => {
    const validationError = validate();

    if (validationError) {
      setFormError(validationError);
      return false;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createFarmerActivityLog(buildFormData());

      if (activityType === 'biochar_application') {
        const estimate = calculateBiocharDmrv(biocharDmrv);

        if (estimate && selectedFarmId) {
          await createFarmerCarbonEstimate({
            calculation_category: 'biochar_carbon_removal',
            farm_id: selectedFarmId,
            feedstock_quantity: Number(biocharDmrv.feedstockQuantity),
            biochar_yield: Number(biocharDmrv.biocharYield),
            fixed_carbon_percent: Number(biocharDmrv.fixedCarbonPercent),
            estimated_co2e: estimate.estimatedCo2eTonnes,
            estimated_carbon_credits: estimate.estimatedCarbonCredits,
          });
        }
      }

      await AsyncStorage.removeItem(ACTIVITY_DRAFT_KEY);
      return true;
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to submit activity.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    setSavingDraft(true);
    setFormError(null);

    try {
      await AsyncStorage.setItem(ACTIVITY_DRAFT_KEY, JSON.stringify(buildDraft()));
      return true;
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save draft.'));
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const pickCameraEvidence = async () => {
    const captured = await liveEvidence.captureEvidence();

    if (captured) {
      setLatitude(captured.latitude);
      setLongitude(captured.longitude);
      setAccuracy(captured.accuracy);
    }
  };

  return {
    farms,
    farmsLoading,
    selectedFarmId,
    selectedFarm,
    setSelectedFarmId,
    activityType,
    setActivityType,
    activityDate,
    setActivityDate,
    description,
    setDescription,
    quantity,
    setQuantity,
    unit,
    setUnit,
    biocharDmrv,
    setBiocharDmrv,
    evidence: liveEvidence.evidence,
    pendingEvidence: liveEvidence.pendingEvidence,
    clearEvidence: liveEvidence.clearEvidence,
    latitude,
    longitude,
    accuracy,
    gpsLoading,
    gpsCaptured: liveEvidence.gpsCaptured || (latitude !== null && longitude !== null),
    captureGps,
    pickCameraEvidence,
    retakeCameraEvidence: liveEvidence.retakeEvidence,
    confirmPendingEvidence: liveEvidence.confirmPending,
    rejectPendingEvidence: liveEvidence.rejectPending,
    evidenceCapturing: liveEvidence.capturing,
    evidenceError: liveEvidence.error,
    submitActivity,
    saveDraft,
    submitting,
    savingDraft,
    error: error ?? liveEvidence.error,
    setError: (message: string | null) => {
      setFormError(message);
      liveEvidence.setError(message);
    },
  };
}