import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  createArtisanBiocharMixing,
  getArtisanBiocharMixing,
  getArtisanProfile,
  saveArtisanBiocharMixingDraft,
  submitArtisanBiocharMixing,
} from '../api/artisanApi';
import {
  createOfficerFarmerBiocharMixing,
  getOfficerBiocharMixing,
  getFieldOfficerProfile,
  saveOfficerBiocharMixingDraft,
  submitOfficerBiocharMixing,
} from '../api/fieldOfficerApi';
import {
  createFarmerBiocharMixing,
  getFarmerBiocharMixing,
  getFarmerProfile,
  saveFarmerBiocharMixingDraft,
  submitFarmerBiocharMixing,
} from '../api/farmerApi';
import {
  BIOCHAR_MIXING_EVIDENCE_API_FIELD,
  type BiocharMixingEvidenceKey,
} from '../constants/biocharMixing';
import { pickString, type ApiRecord } from '../utils/apiHelpers';
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

interface UseBiocharMixingFormOptions {
  farmerId?: number;
  farmId?: number;
  recordId?: number;
  apiMode?: 'officer' | 'farmer' | 'artisan';
  selectionPrefill?: {
    farmerName?: string;
    phoneNumber?: string;
    village?: string;
    taluka?: string;
    district?: string;
    state?: string;
  };
}

function hydrateRecord(record: ApiRecord) {
  return {
    recordId: Number(record.id),
    mixingRecordId: pickString(record, 'mixing_record_id', 'mixingRecordId'),
    state: pickString(record, 'state') !== '-' ? pickString(record, 'state') : 'Maharashtra',
    site: pickString(record, 'site') !== '-' ? pickString(record, 'site') : '',
    dateOfMixing:
      pickString(record, 'date_of_mixing', 'dateOfMixing') !== '-'
        ? pickString(record, 'date_of_mixing', 'dateOfMixing').slice(0, 10)
        : todayIsoDate(),
    latitude: record.latitude != null ? Number(record.latitude) : null,
    longitude: record.longitude != null ? Number(record.longitude) : null,
    altitude: record.altitude != null ? Number(record.altitude) : null,
    accuracyM: record.gps_accuracy != null ? Number(record.gps_accuracy) : null,
    farmerName: pickString(record, 'farmer_name', 'farmerName') !== '-' ? pickString(record, 'farmer_name', 'farmerName') : '',
    phoneNumber: pickString(record, 'phone_number', 'phoneNumber') !== '-' ? pickString(record, 'phone_number', 'phoneNumber') : '',
    acresOfCotton: record.acres_of_cotton_production != null ? String(record.acres_of_cotton_production) : '',
    batchNumbers: pickString(record, 'batch_numbers', 'batchNumbers') !== '-' ? pickString(record, 'batch_numbers', 'batchNumbers') : '',
    notes: pickString(record, 'notes') !== '-' ? pickString(record, 'notes') : '',
    canEdit: record.can_edit !== false,
    canSubmit: record.can_submit !== false,
    status: pickString(record, 'status') !== '-' ? pickString(record, 'status') : 'draft',
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
        capturedAt: pickString(item, 'captured_at', 'capturedAt') !== '-' ? pickString(item, 'captured_at', 'capturedAt') : undefined,
        isDocument: key === 'farmer_consent_signed_copy' && !url.toLowerCase().includes('.jpg'),
      };
    }
  }

  return mapped;
}

export function useBiocharMixingForm({
  farmerId,
  farmId,
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
  const [recordStatus, setRecordStatus] = useState('draft');

  const [state, setState] = useState('Maharashtra');
  const [site, setSite] = useState('');
  const [dateOfMixing, setDateOfMixing] = useState(todayIsoDate());
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [gpsAccuracyTier, setGpsAccuracyTier] = useState<ArtisanGpsAccuracyTier>('unknown');
  const [gpsCapturedAt, setGpsCapturedAt] = useState<string | null>(null);
  const [villageName, setVillageName] = useState('');
  const [talukaName, setTalukaName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [stateName, setStateName] = useState('');
  const [farmerName, setFarmerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [acresOfCotton, setAcresOfCotton] = useState('');
  const [batchNumbers, setBatchNumbers] = useState('');
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<Partial<Record<BiocharMixingEvidenceKey, BiocharMixingEvidenceAsset>>>({});

  const statusLabel = useMemo(() => (recordStatus === 'submitted' ? 'Submitted' : 'Draft'), [recordStatus]);

  const applyRecord = useCallback((record: ApiRecord) => {
    const hydrated = hydrateRecord(record);
    setRecordId(hydrated.recordId);
    setMixingRecordId(hydrated.mixingRecordId !== '-' ? hydrated.mixingRecordId : '');
    setState(hydrated.state);
    setSite(hydrated.site);
    setDateOfMixing(hydrated.dateOfMixing);
    setLatitude(hydrated.latitude);
    setLongitude(hydrated.longitude);
    setAltitude(hydrated.altitude);
    setAccuracyM(hydrated.accuracyM);
    setFarmerName(hydrated.farmerName);
    setPhoneNumber(hydrated.phoneNumber);
    setAcresOfCotton(hydrated.acresOfCotton);
    setBatchNumbers(hydrated.batchNumbers);
    setNotes(hydrated.notes);
    setCanEdit(hydrated.canEdit);
    setCanSubmit(hydrated.canSubmit);
    setRecordStatus(hydrated.status);
    setEvidence(mapRemoteEvidences(record));
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isArtisanMode) {
        await getArtisanProfile();
        if (selectionPrefill && !recordId) {
          if (selectionPrefill.farmerName) {
            setFarmerName(selectionPrefill.farmerName);
          }
          if (selectionPrefill.phoneNumber) {
            setPhoneNumber(selectionPrefill.phoneNumber);
          }
          if (selectionPrefill.village) {
            setSite(selectionPrefill.village);
          }
          if (selectionPrefill.state) {
            setState(selectionPrefill.state);
          }
        }
      } else if (isOfficerMode) {
        await getFieldOfficerProfile();
      } else {
        const profile = (await getFarmerProfile()) as ApiRecord;
        const name = pickString(profile, 'name', 'farmer_name', 'farmerName');
        const mobile = pickString(profile, 'mobile', 'phone_number', 'phoneNumber');
        if (name !== '-') {
          setFarmerName(name);
        }
        if (mobile !== '-') {
          setPhoneNumber(mobile);
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
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load Biochar Mixing form.'));
    } finally {
      setLoading(false);
    }
  }, [applyRecord, isArtisanMode, isOfficerMode, recordId, selectionPrefill]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const recaptureGps = useCallback(async () => {
    setCapturingGps(true);

    try {
      const capture = await captureBiocharGps();
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
      }

      if (capture.isPoorAccuracy) {
        showBiocharPoorAccuracyWarning();
      }
    } catch (gpsError) {
      Alert.alert('GPS capture failed', getApiErrorMessage(gpsError, 'Unable to capture GPS location.'));
    } finally {
      setCapturingGps(false);
    }
  }, []);

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

  const buildFormData = useCallback((): FormData => {
    const formData = new FormData();

    if (isArtisanMode && farmId) {
      formData.append('farm_id', String(farmId));
    }

    if (state.trim()) {
      formData.append('state', state.trim());
    }
    if (site.trim()) {
      formData.append('site', site.trim());
    }
    if (dateOfMixing.trim()) {
      formData.append('date_of_mixing', dateOfMixing.trim());
    }
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
    if (farmerName.trim()) {
      formData.append('farmer_name', farmerName.trim());
    }
    if (phoneNumber.trim()) {
      formData.append('phone_number', phoneNumber.trim());
    }
    if (acresOfCotton.trim()) {
      formData.append('acres_of_cotton_production', acresOfCotton.trim());
    }
    if (batchNumbers.trim()) {
      formData.append('batch_numbers', batchNumbers.trim());
    }
    if (notes.trim()) {
      formData.append('notes', notes.trim());
    }

    for (const [key, asset] of Object.entries(evidence) as Array<[BiocharMixingEvidenceKey, BiocharMixingEvidenceAsset]>) {
      if (!asset?.uri || asset.remoteUrl) {
        continue;
      }

      const apiField = BIOCHAR_MIXING_EVIDENCE_API_FIELD[key];
      const filename = `${key}.jpg`;
      formData.append(apiField, {
        uri: asset.uri,
        name: filename,
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
    acresOfCotton,
    accuracyM,
    altitude,
    batchNumbers,
    dateOfMixing,
    districtName,
    evidence,
    farmId,
    farmerName,
    gpsCapturedAt,
    isArtisanMode,
    latitude,
    longitude,
    notes,
    phoneNumber,
    site,
    state,
    stateName,
    talukaName,
    villageName,
  ]);

  const persistDraft = useCallback(async (): Promise<number> => {
    const formData = buildFormData();
    let id = recordId;

    if (isArtisanMode) {
      if (!id) {
        const created = (await createArtisanBiocharMixing(formData)) as ApiRecord;
        const record = (created.mixing ?? created.record ?? created) as ApiRecord;
        id = Number(record.id);
        applyRecord(record);
      } else {
        const saved = (await saveArtisanBiocharMixingDraft(id, formData)) as ApiRecord;
        applyRecord((saved.mixing ?? saved.record ?? saved) as ApiRecord);
      }
    } else if (isOfficerMode) {
      if (!farmerId) {
        throw new Error('Farmer is required for field officer Biochar Mixing.');
      }

      if (!id) {
        const created = (await createOfficerFarmerBiocharMixing(farmerId, formData)) as ApiRecord;
        const record = (created.mixing ?? created.record ?? created) as ApiRecord;
        id = Number(record.id);
        applyRecord(record);
      } else {
        const saved = (await saveOfficerBiocharMixingDraft(id, formData)) as ApiRecord;
        applyRecord((saved.mixing ?? saved.record ?? saved) as ApiRecord);
      }
    } else if (!id) {
      const created = (await createFarmerBiocharMixing(formData)) as ApiRecord;
      const record = (created.mixing ?? created.record ?? created) as ApiRecord;
      id = Number(record.id);
      applyRecord(record);
    } else {
      const saved = (await saveFarmerBiocharMixingDraft(id, formData)) as ApiRecord;
      applyRecord((saved.mixing ?? saved.record ?? saved) as ApiRecord);
    }

    if (!id) {
      throw new Error('Unable to save Biochar Mixing draft.');
    }

    return id;
  }, [applyRecord, buildFormData, farmerId, isArtisanMode, isOfficerMode, recordId]);

  const saveDraft = useCallback(async (): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      await persistDraft();
      return true;
    } catch (draftError) {
      const message = getApiErrorMessage(draftError, 'Unable to save Biochar Mixing draft.');
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
      if (!dateOfMixing.trim()) {
        throw new Error('Date of mixing is required.');
      }
      if (!farmerName.trim()) {
        throw new Error('Farmer name is required.');
      }
      if (!state.trim()) {
        throw new Error('State is required.');
      }
      if (latitude == null || longitude == null) {
        throw new Error('Capture mixing location GPS before submit.');
      }

      const id = await persistDraft();
      const response = isArtisanMode
        ? ((await submitArtisanBiocharMixing(id)) as ApiRecord)
        : isOfficerMode
          ? ((await submitOfficerBiocharMixing(id)) as ApiRecord)
          : ((await submitFarmerBiocharMixing(id)) as ApiRecord);

      const record = (response.mixing ?? response.record ?? response) as ApiRecord;
      applyRecord(record);
      return pickString(record, 'mixing_record_id', 'mixingRecordId') !== '-'
        ? pickString(record, 'mixing_record_id', 'mixingRecordId')
        : String(id);
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Unable to submit Biochar Mixing.');
      setError(message);
      Alert.alert('Submit failed', message);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [applyRecord, dateOfMixing, farmerName, isArtisanMode, isOfficerMode, latitude, longitude, persistDraft, state]);

  return {
    loading,
    submitting,
    capturingGps,
    error,
    recordId,
    mixingRecordId,
    statusLabel,
    canEdit,
    canSubmit,
    state,
    setState,
    site,
    setSite,
    dateOfMixing,
    setDateOfMixing,
    latitude,
    longitude,
    altitude,
    accuracyM,
    gpsAccuracyTier,
    gpsCapturedAt,
    farmerName,
    setFarmerName,
    phoneNumber,
    setPhoneNumber,
    acresOfCotton,
    setAcresOfCotton,
    batchNumbers,
    setBatchNumbers,
    notes,
    setNotes,
    evidence,
    recaptureGps,
    addEvidence,
    removeEvidence,
    saveDraft,
    submit,
    reload: loadInitialData,
  };
}
