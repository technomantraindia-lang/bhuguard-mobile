import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  createFarmerFeedstockCollection,
  getFarmerFarms,
  getFarmerProfile,
  getFarmerServices,
} from '../api/farmerApi';
import {
  DEFAULT_FEEDSTOCK_QUANTITY_UNIT,
  DEFAULT_FEEDSTOCK_TYPE,
  type FeedstockQuantityUnit,
  type FeedstockTypeValue,
} from '../constants/feedstockTypes';
import { useLiveEvidenceCapture } from './useLiveEvidenceCapture';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { formatFarmerCode } from '../utils/farmerActivityHelpers';
import { getFarmLocationLabel, mapFarmRecord } from '../utils/farmMapHelpers';

const FEEDSTOCK_DRAFT_KEY = 'bhuguard_feedstock_collection_draft';

export interface FeedstockFarmOption {
  id: number;
  name: string;
  subtitle: string;
}

export interface FeedstockRecordContext {
  fullName: string;
  farmerCode: string;
  projectName: string;
  farmName: string;
}

interface UseAddFeedstockCollectionFormOptions {
  initialFarmId?: number;
}

interface FeedstockDraft {
  farmId: number | null;
  feedstockType: FeedstockTypeValue;
  otherFeedstockLabel: string;
  quantity: string;
  quantityUnit: FeedstockQuantityUnit;
  notes: string;
}

function resolveProjectName(servicesData: ApiRecord): string {
  const services = extractList(servicesData, ['services']);

  for (const service of services) {
    const name = pickString(service, 'service_name', 'name', 'title');

    if (/biochar/i.test(name)) {
      return name !== '-' ? name : 'Biochar';
    }
  }

  return 'Biochar';
}

export function useAddFeedstockCollectionForm({ initialFarmId }: UseAddFeedstockCollectionFormOptions = {}) {
  const [farms, setFarms] = useState<FeedstockFarmOption[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(initialFarmId ?? null);
  const [recordContext, setRecordContext] = useState<FeedstockRecordContext>({
    fullName: 'Farmer',
    farmerCode: '—',
    projectName: 'Biochar',
    farmName: '—',
  });
  const [feedstockType, setFeedstockType] = useState<FeedstockTypeValue>(DEFAULT_FEEDSTOCK_TYPE);
  const [otherFeedstockLabel, setOtherFeedstockLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState<FeedstockQuantityUnit>(DEFAULT_FEEDSTOCK_QUANTITY_UNIT);
  const [notes, setNotes] = useState('');
  const [collectionDate] = useState(() => new Date());
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const liveEvidence = useLiveEvidenceCapture({ defaultName: 'feedstock-photo.jpg', allowsEditing: false });
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const gpsCaptured = latitude !== null && longitude !== null;

  const collectionDateLabel = useMemo(
    () =>
      collectionDate.toLocaleString(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    [collectionDate],
  );

  const loadContext = useCallback(async () => {
    setFarmsLoading(true);
    setError(null);

    try {
      const [profileData, farmsData, servicesData] = await Promise.all([
        getFarmerProfile(),
        getFarmerFarms(),
        getFarmerServices().catch(() => ({}) as ApiRecord),
      ]);

      const profile = (profileData as ApiRecord).farmer ?? profileData;
      const profileRecord = profile as ApiRecord;
      const farmRecords = extractList(farmsData as ApiRecord, ['farms']);
      const options = farmRecords
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

      setSelectedFarmId((current) => {
        if (initialFarmId && options.some((farm) => farm.id === initialFarmId)) {
          return initialFarmId;
        }

        return current ?? (options.length === 1 ? options[0].id : null);
      });

      const resolvedFarmId =
        initialFarmId && options.some((farm) => farm.id === initialFarmId)
          ? initialFarmId
          : options.length === 1
            ? options[0].id
            : null;
      const selected = options.find((farm) => farm.id === resolvedFarmId) ?? null;

      setRecordContext({
        fullName: pickString(profileRecord, 'full_name', 'name') !== '-'
          ? pickString(profileRecord, 'full_name', 'name')
          : 'Farmer',
        farmerCode: formatFarmerCode(profileRecord),
        projectName: resolveProjectName(servicesData as ApiRecord),
        farmName: selected?.name ?? '—',
      });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load feedstock form data.'));
    } finally {
      setFarmsLoading(false);
    }
  }, [initialFarmId]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  useEffect(() => {
    if (selectedFarm) {
      setRecordContext((current) => ({ ...current, farmName: selectedFarm.name }));
    }
  }, [selectedFarm]);

  const captureGps = useCallback(async () => {
    setGpsLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setError('Location permission is required to capture collection GPS.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to capture GPS location.'));
    } finally {
      setGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    void captureGps();
  }, [captureGps]);

  const pickCameraPhoto = async () => {
    const captured = await liveEvidence.captureEvidence();

    if (captured?.latitude != null && captured.longitude != null) {
      setLatitude(captured.latitude);
      setLongitude(captured.longitude);
    }
  };

  const buildDraft = (): FeedstockDraft => ({
    farmId: selectedFarmId,
    feedstockType,
    otherFeedstockLabel,
    quantity,
    quantityUnit,
    notes,
  });

  const validate = (): string | null => {
    if (!selectedFarmId) {
      return 'Please select a farm for this feedstock collection.';
    }

    if (feedstockType === 'other' && !otherFeedstockLabel.trim()) {
      return 'Describe the feedstock type when Other is selected.';
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return 'Enter a valid feedstock quantity.';
    }

    if (!gpsCaptured) {
      return 'Capture GPS location before submitting.';
    }

    if (!liveEvidence.evidence) {
      return 'Take at least one live photo of the feedstock.';
    }

    return null;
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();

    formData.append('farm_id', String(selectedFarmId));
    formData.append('feedstock_type', feedstockType);
    formData.append('quantity', String(Number(quantity)));
    formData.append('quantity_unit', quantityUnit);
    formData.append('collection_date', todayIsoDate());

    if (feedstockType === 'other') {
      formData.append('feedstock_source', otherFeedstockLabel.trim());
    } else if (notes.trim()) {
      formData.append('feedstock_source', notes.trim());
    }

    if (latitude !== null) {
      formData.append('gps_latitude', String(latitude));
    }

    if (longitude !== null) {
      formData.append('gps_longitude', String(longitude));
    }

    if (liveEvidence.evidence) {
      formData.append('photo', {
        uri: liveEvidence.evidence.uri,
        name: liveEvidence.evidence.name,
        type: liveEvidence.evidence.type,
      } as unknown as Blob);
    }

    return formData;
  };

  const submit = async (): Promise<string | null> => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return null;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = (await createFarmerFeedstockCollection(buildFormData())) as ApiRecord;
      const collection = (response.collection ?? response) as ApiRecord;
      await AsyncStorage.removeItem(FEEDSTOCK_DRAFT_KEY);

      return pickString(collection, 'feedstock_code') !== '-'
        ? pickString(collection, 'feedstock_code')
        : 'Submitted';
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit feedstock collection.'));
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    setSavingDraft(true);
    setError(null);

    try {
      await AsyncStorage.setItem(FEEDSTOCK_DRAFT_KEY, JSON.stringify(buildDraft()));
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save draft.'));
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  return {
    farms,
    farmsLoading,
    selectedFarmId,
    selectedFarm,
    setSelectedFarmId,
    recordContext,
    feedstockType,
    setFeedstockType,
    otherFeedstockLabel,
    setOtherFeedstockLabel,
    quantity,
    setQuantity,
    quantityUnit,
    setQuantityUnit,
    notes,
    setNotes,
    collectionDateLabel,
    latitude,
    longitude,
    gpsCaptured,
    gpsLoading,
    captureGps,
    evidence: liveEvidence.evidence,
    evidenceCapturing: liveEvidence.capturing,
    evidenceError: liveEvidence.error,
    pickCameraPhoto,
    retakeCameraPhoto: liveEvidence.retakeEvidence,
    submitting,
    savingDraft,
    error,
    setError,
    submit,
    saveDraft,
  };
}
