import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { createFarmerActivityLog, getFarmerFarms } from '../api/farmerApi';
import { DEFAULT_ACTIVITY_TYPE } from '../constants/farmerActivityTypes';
import { DEFAULT_ACTIVITY_UNIT } from '../constants/farmerActivityUnits';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { getFarmLocationLabel, mapFarmRecord } from '../utils/farmMapHelpers';

const ACTIVITY_DRAFT_KEY = 'bhuguard_activity_draft';

export interface SubmitActivityFarmOption {
  id: number;
  name: string;
  subtitle: string;
}

export interface SubmitActivityEvidence {
  uri: string;
  name: string;
  type: string;
  label: string;
}

export interface SubmitActivityDraft {
  farmId: number | null;
  activityType: string;
  activityDate: string;
  description: string;
  quantity: string;
  unit: string;
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
  const [evidence, setEvidence] = useState<SubmitActivityEvidence | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(getApiErrorMessage(err, 'Failed to load farms.'));
    } finally {
      setFarmsLoading(false);
    }
  }, [initialFarmId]);

  const captureGps = useCallback(async () => {
    setGpsLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setError('Location permission is required to capture farm GPS.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setAccuracy(position.coords.accuracy ?? null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to capture GPS location.'));
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

    if (latitude !== null) {
      formData.append('gps_latitude', String(latitude));
    }

    if (longitude !== null) {
      formData.append('gps_longitude', String(longitude));
    }

    if (accuracy !== null) {
      formData.append('gps_accuracy', String(accuracy));
    }

    if (evidence) {
      formData.append('evidence_photo', {
        uri: evidence.uri,
        name: evidence.name,
        type: evidence.type,
      } as unknown as Blob);
    }

    return formData;
  };

  const submitActivity = async (): Promise<boolean> => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createFarmerActivityLog(buildFormData());
      await AsyncStorage.removeItem(ACTIVITY_DRAFT_KEY);
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit activity.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    setSavingDraft(true);
    setError(null);

    try {
      await AsyncStorage.setItem(ACTIVITY_DRAFT_KEY, JSON.stringify(buildDraft()));
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save draft.'));
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const pickCameraEvidence = async () => {
    setError(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Camera permission is required to capture evidence.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setEvidence({
      uri: asset.uri,
      name: asset.fileName ?? 'camera-evidence.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      label: asset.fileName ?? 'Camera photo',
    });
  };

  const pickGalleryEvidence = async () => {
    setError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Gallery permission is required to upload evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setEvidence({
      uri: asset.uri,
      name: asset.fileName ?? 'gallery-evidence.jpg',
      type: asset.mimeType ?? 'image/jpeg',
      label: asset.fileName ?? 'Gallery photo',
    });
  };

  const pickDocumentEvidence = async () => {
    setError(null);

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['image/*', 'application/pdf'],
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setEvidence({
      uri: asset.uri,
      name: asset.name ?? 'document.pdf',
      type: asset.mimeType ?? 'application/pdf',
      label: asset.name ?? 'Document',
    });
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
    evidence,
    clearEvidence: () => setEvidence(null),
    latitude,
    longitude,
    accuracy,
    gpsLoading,
    gpsCaptured: latitude !== null && longitude !== null,
    captureGps,
    pickCameraEvidence,
    pickGalleryEvidence,
    pickDocumentEvidence,
    submitActivity,
    saveDraft,
    submitting,
    savingDraft,
    error,
    setError,
  };
}
