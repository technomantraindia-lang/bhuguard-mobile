import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFarmerFarmActivity,
  getFarmerMyFarms,
  saveFarmerFarmActivityDraft,
  submitFarmerFarmActivity,
} from '../api/farmerApi';
import { useLiveEvidenceCapture } from './useLiveEvidenceCapture';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { appendClientStampMetadata } from '../utils/liveEvidenceCapture';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';

export interface FarmerLinkedFarmOption {
  farmId: number;
  farmCode: string;
  farmName: string;
  farmerId: number;
  farmerCode: string;
  farmerName: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  areaLabel: string;
  ownershipType: string;
  lastFarmUpdateDate: string | null;
  nextFarmUpdateDate: string | null;
  farmUpdateStatusLabel: string;
  statusColor: string;
}

interface UseFarmerFarmActivityFormOptions {
  farmId?: number;
  activityId?: number;
}

function mapLinkedFarm(record: ApiRecord): FarmerLinkedFarmOption {
  const areaAcre = record.area_acre ?? record.area_acres;
  const areaHectare = record.area_hectare ?? record.area_hectares;

  return {
    farmId: Number(record.farm_id ?? record.id ?? 0),
    farmCode: pickString(record, 'farm_code', 'farmCode'),
    farmName: pickString(record, 'farm_name', 'farmName', 'name'),
    farmerId: Number(record.farmer_id ?? 0),
    farmerCode: pickString(record, 'farmer_code', 'farmerCode'),
    farmerName: pickString(record, 'farmer_name', 'farmerName'),
    village: pickString(record, 'village'),
    taluka: pickString(record, 'taluka'),
    district: pickString(record, 'district'),
    state: pickString(record, 'state'),
    areaLabel:
      areaAcre && areaAcre !== '-'
        ? `${areaAcre} acres`
        : areaHectare && areaHectare !== '-'
          ? `${areaHectare} ha`
          : '—',
    ownershipType: pickString(record, 'ownership_type', 'ownershipType'),
    lastFarmUpdateDate: pickString(record, 'last_farm_update_date', 'lastFarmUpdateDate') || null,
    nextFarmUpdateDate: pickString(record, 'next_farm_update_date', 'nextFarmUpdateDate') || null,
    farmUpdateStatusLabel: pickString(record, 'farm_update_status_label', 'farmUpdateStatusLabel'),
    statusColor: pickString(record, 'status_color', 'statusColor'),
  };
}

export function useFarmerFarmActivityForm({ farmId, activityId }: UseFarmerFarmActivityFormOptions = {}) {
  const liveEvidence = useLiveEvidenceCapture({ defaultName: 'farm-activity.jpg', allowsEditing: true });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<FarmerLinkedFarmOption[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(farmId ?? null);
  const [recordId, setRecordId] = useState<number | null>(activityId ?? null);
  const [activityDate, setActivityDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.farmId === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const farmsData = await getFarmerMyFarms();
      const linkedFarms = extractList(farmsData as ApiRecord, ['farms']).map(mapLinkedFarm).filter((farm) => farm.farmId > 0);
      setFarms(linkedFarms);

      if (!selectedFarmId && linkedFarms.length === 1) {
        setSelectedFarmId(linkedFarms[0]?.farmId ?? null);
      } else if (farmId) {
        setSelectedFarmId(farmId);
      }

      if (activityId) {
        const detail = await getFarmerFarmActivity(activityId);
        const activity = (detail.farm_activity ?? detail) as ApiRecord;
        setRecordId(Number(activity.id));
        setSelectedFarmId(Number(activity.farm_id));
        setActivityDate(pickString(activity, 'activity_date', 'activityDate') || todayIsoDate());
        setNotes(pickString(activity, 'notes') === '-' ? '' : pickString(activity, 'notes'));
        setLatitude(activity.latitude != null ? Number(activity.latitude) : null);
        setLongitude(activity.longitude != null ? Number(activity.longitude) : null);
        setAccuracy(activity.gps_accuracy != null ? Number(activity.gps_accuracy) : null);
        setAltitude(activity.altitude != null ? Number(activity.altitude) : null);
        setStatus((pickString(activity, 'status') as 'draft' | 'submitted') || 'draft');
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load Farm Activity form.'));
    } finally {
      setLoading(false);
    }
  }, [activityId, farmId, selectedFarmId]);

  useEffect(() => {
    void load();
  }, [load]);

  const captureGps = useCallback(async () => {
    setCapturingGps(true);

    try {
      const gps = await captureHighAccuracyGps();
      setLatitude(gps.latitude);
      setLongitude(gps.longitude);
      setAccuracy(gps.accuracyM);
      if (gps.altitude != null) {
        setAltitude(gps.altitude);
      }
    } catch (gpsError) {
      Alert.alert('GPS capture failed', getApiErrorMessage(gpsError, 'Unable to capture GPS location.'));
    } finally {
      setCapturingGps(false);
    }
  }, []);

  const buildFormData = useCallback(
    (forSubmit: boolean) => {
      if (!selectedFarmId) {
        throw new Error('Please select a linked farm.');
      }

      const formData = new FormData();
      formData.append('farm_id', String(selectedFarmId));
      formData.append('activity_date', activityDate);
      formData.append('notes', notes);

      if (recordId) {
        formData.append('id', String(recordId));
      }

      if (latitude != null) {
        formData.append('latitude', String(latitude));
      }
      if (longitude != null) {
        formData.append('longitude', String(longitude));
      }
      if (accuracy != null) {
        formData.append('gps_accuracy', String(accuracy));
      }
      if (altitude != null) {
        formData.append('altitude', String(altitude));
      }

      if (selectedFarm) {
        formData.append('village', selectedFarm.village !== '-' ? selectedFarm.village : '');
        formData.append('taluka', selectedFarm.taluka !== '-' ? selectedFarm.taluka : '');
        formData.append('district', selectedFarm.district !== '-' ? selectedFarm.district : '');
        formData.append('state', selectedFarm.state !== '-' ? selectedFarm.state : '');
      }

      if (liveEvidence.evidence) {
        formData.append(
          'farm_activity_photo',
          {
            uri: liveEvidence.evidence.uri,
            name: liveEvidence.evidence.name,
            type: liveEvidence.evidence.type,
          } as unknown as Blob,
        );
        appendClientStampMetadata(formData, liveEvidence.evidence);
      } else if (forSubmit) {
        throw new Error('Farm Activity Photo is required.');
      }

      return formData;
    },
    [accuracy, activityDate, altitude, latitude, liveEvidence.evidence, longitude, notes, recordId, selectedFarm, selectedFarmId],
  );

  const saveDraft = useCallback(async () => {
    setSavingDraft(true);
    setError(null);

    try {
      const formData = buildFormData(false);
      const response = await saveFarmerFarmActivityDraft(formData);
      const activity = (response.farm_activity ?? response) as ApiRecord;
      setRecordId(Number(activity.id));
      setStatus('draft');
      return true;
    } catch (draftError) {
      setError(getApiErrorMessage(draftError, 'Unable to save draft.'));
      return false;
    } finally {
      setSavingDraft(false);
    }
  }, [buildFormData]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (latitude == null || longitude == null || accuracy == null) {
        throw new Error('GPS location with accuracy is required before submit.');
      }

      const formData = buildFormData(true);
      await submitFarmerFarmActivity(formData);
      setStatus('submitted');
      return true;
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to submit Farm Activity.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [accuracy, buildFormData, latitude, longitude]);

  return {
    loading,
    submitting,
    savingDraft,
    error,
    farms,
    selectedFarm,
    selectedFarmId,
    setSelectedFarmId,
    activityDate,
    setActivityDate,
    notes,
    setNotes,
    latitude,
    longitude,
    accuracy,
    altitude,
    capturingGps,
    captureGps,
    liveEvidence,
    status,
    recordId,
    saveDraft,
    submit,
    reload: load,
  };
}
