import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFarmerFarmActivity,
  getFarmerMyFarms,
  submitFarmerFarmActivity,
} from '../api/farmerApi';
import {
  buildFarmerFarmActivityDraftKey,
  clearFarmerFarmActivityDraft,
  loadFarmerFarmActivityDraft,
  migrateFarmerFarmActivityDraft,
  type FarmerFarmActivityLocalDraft,
} from '../storage/farmerFarmActivityDraftStorage';
import { getAuthUser } from '../storage/authStorage';
import { extractList, pickString, type ApiRecord } from '../utils/apiHelpers';
import { todayIsoDate } from '../utils/activityDateHelpers';
import { appendClientStampMetadata, type LiveCapturedEvidence } from '../utils/liveEvidenceCapture';
import { buildLivePhotoWatermarkMeta } from '../utils/livePhotoWatermarkFormat';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import { formatEvidenceStampLabel } from '../utils/evidenceDateTime';
import {
  clearFarmerFarmActivityEvidenceDirectory,
  createFarmActivityClientDraftUuid,
  ensurePersistedFarmerFarmActivityEvidence,
  localEvidenceFileExists,
  resolveFarmerFarmActivityEvidenceUrl,
  type FarmerFarmActivityEvidenceAsset,
} from '../utils/farmerFarmActivityEvidencePersistence';
import { useLiveEvidenceCapture } from './useLiveEvidenceCapture';

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

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function deviceUtcOffset(): string {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
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

function evidenceFromLive(evidence: LiveCapturedEvidence): FarmerFarmActivityEvidenceAsset {
  return {
    uri: evidence.uri,
    previewUri: evidence.previewUri || evidence.uri,
    name: evidence.name,
    type: evidence.type,
    label: evidence.label,
    latitude: evidence.latitude,
    longitude: evidence.longitude,
    accuracy: evidence.accuracy,
    capturedAt: evidence.capturedAt,
    village: evidence.village,
    taluka: evidence.taluka,
    district: evidence.district,
    state: evidence.state,
    isStamped: true,
    uploadStatus: 'local_pending',
  };
}

function liveFromAsset(asset: FarmerFarmActivityEvidenceAsset): LiveCapturedEvidence {
  const village = asset.village || '';
  const taluka = asset.taluka || '';
  const district = asset.district || '';
  const state = asset.state || '';

  return {
    uri: asset.localUri || asset.uri,
    previewUri: asset.previewUri || asset.localUri || asset.uri,
    name: asset.name,
    type: asset.type,
    label: asset.label || 'Farm Activity Photo',
    latitude: asset.latitude,
    longitude: asset.longitude,
    accuracy: asset.accuracy,
    capturedAt: asset.capturedAt,
    village,
    taluka,
    district,
    state,
    watermark: buildLivePhotoWatermarkMeta({
      capturedAt: asset.capturedAt,
      latitude: asset.latitude,
      longitude: asset.longitude,
      accuracy: asset.accuracy,
      village,
      taluka,
      district,
      state,
    }),
  };
}

function remoteEvidenceFromActivity(activity: ApiRecord): FarmerFarmActivityEvidenceAsset | null {
  const photoUrl =
    resolveFarmerFarmActivityEvidenceUrl(
      pickString(activity, 'farm_activity_photo_url', 'farm_activity_photo_path', 'stamped_farm_activity_photo_path'),
    ) || null;

  if (!photoUrl) {
    return null;
  }

  return {
    uri: photoUrl,
    previewUri: photoUrl,
    remoteUrl: photoUrl,
    name: pickString(activity, 'farm_activity_photo_original_name') !== '-'
      ? pickString(activity, 'farm_activity_photo_original_name')
      : 'farm-activity.jpg',
    type: pickString(activity, 'farm_activity_photo_mime_type') !== '-'
      ? pickString(activity, 'farm_activity_photo_mime_type')
      : 'image/jpeg',
    latitude: activity.latitude != null ? Number(activity.latitude) : null,
    longitude: activity.longitude != null ? Number(activity.longitude) : null,
    accuracy: activity.gps_accuracy != null ? Number(activity.gps_accuracy) : null,
    capturedAt: pickString(activity, 'captured_at') !== '-' ? pickString(activity, 'captured_at') : new Date().toISOString(),
    evidenceId: Number(activity.id) || null,
    uploadStatus: 'uploaded',
    isStamped: true,
  };
}

export function useFarmerFarmActivityForm({ farmId, activityId }: UseFarmerFarmActivityFormOptions = {}) {
  const liveEvidence = useLiveEvidenceCapture({
    defaultName: 'farm-activity.jpg',
    allowsEditing: false,
    requireConfirm: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farms, setFarms] = useState<FarmerLinkedFarmOption[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(farmId ?? null);
  const [recordId, setRecordId] = useState<number | null>(activityId ?? null);
  const [draftUuid, setDraftUuid] = useState(() => createFarmActivityClientDraftUuid());
  const [activityDate, setActivityDate] = useState(todayIsoDate());
  const [capturedAt, setCapturedAt] = useState(() => new Date().toISOString());
  const [timezone, setTimezone] = useState(deviceTimezone);
  const [utcOffset, setUtcOffset] = useState(deviceUtcOffset);
  const [dateLocked, setDateLocked] = useState(false);
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [altitude, setAltitude] = useState<number | null>(null);
  const [capturingGps, setCapturingGps] = useState(false);
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');
  const [userId, setUserId] = useState<number | null>(null);
  const [farmerId, setFarmerId] = useState<number | null>(null);
  const evidenceAssetRef = useRef<FarmerFarmActivityEvidenceAsset | null>(null);

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.farmId === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const draftStorageKey = useMemo(
    () =>
      buildFarmerFarmActivityDraftKey({
        userId,
        farmerId: farmerId ?? selectedFarm?.farmerId,
        farmId: selectedFarmId,
        activityId: recordId,
      }),
    [farmerId, recordId, selectedFarm?.farmerId, selectedFarmId, userId],
  );

  const { setEvidence } = liveEvidence;

  const applyEvidenceAsset = useCallback(
    (asset: FarmerFarmActivityEvidenceAsset | null) => {
      evidenceAssetRef.current = asset;
      setEvidence(asset ? liveFromAsset(asset) : null);
    },
    [setEvidence],
  );

  const persistAndSetEvidence = useCallback(
    async (raw: LiveCapturedEvidence) => {
      const farmerKey = farmerId ?? selectedFarm?.farmerId ?? 0;
      const base = evidenceFromLive(raw);

      try {
        const persisted = await ensurePersistedFarmerFarmActivityEvidence(base, farmerKey, draftUuid);
        applyEvidenceAsset(persisted);

        if (persisted.latitude != null && persisted.longitude != null) {
          setLatitude(persisted.latitude);
          setLongitude(persisted.longitude);
          if (persisted.accuracy != null) {
            setAccuracy(persisted.accuracy);
          }
        }

        return persisted;
      } catch (persistError) {
        Alert.alert(
          'Storage warning',
          getApiErrorMessage(persistError, 'Could not copy photo into secure draft storage. Using temporary file for now.'),
        );
        applyEvidenceAsset({ ...base, uploadStatus: 'local_pending' });

        return base;
      }
    },
    [applyEvidenceAsset, draftUuid, farmerId, selectedFarm?.farmerId],
  );

  const captureEvidence = useCallback(async () => {
    const result = await liveEvidence.captureEvidence();

    if (result) {
      await persistAndSetEvidence(result);
    }
  }, [liveEvidence, persistAndSetEvidence]);

  const retakeEvidence = useCallback(async () => {
    const result = await liveEvidence.retakeEvidence();

    if (result) {
      await persistAndSetEvidence(result);
    }
  }, [liveEvidence, persistAndSetEvidence]);

  const pickGalleryEvidence = useCallback(async () => {
    const result = await liveEvidence.pickGalleryEvidence();

    if (result) {
      await persistAndSetEvidence(result);
    }
  }, [liveEvidence, persistAndSetEvidence]);

  const confirmPendingEvidence = useCallback(async () => {
    const confirmed = liveEvidence.confirmPending();
    if (confirmed) {
      await persistAndSetEvidence(confirmed);
    }
  }, [liveEvidence, persistAndSetEvidence]);

  const hydrateLocalDraft = useCallback(
    async (draft: FarmerFarmActivityLocalDraft) => {
      if (draft.draftUuid) {
        setDraftUuid(draft.draftUuid);
      }

      if (draft.farmId) {
        setSelectedFarmId(draft.farmId);
      }

      if (draft.activityId) {
        setRecordId(draft.activityId);
      }

      if (draft.activityDate) {
        setActivityDate(draft.activityDate);
        setDateLocked(true);
      }

      if (draft.capturedAt) {
        setCapturedAt(draft.capturedAt);
      }

      if (draft.timezone) {
        setTimezone(draft.timezone);
      }

      if (draft.utcOffset) {
        setUtcOffset(draft.utcOffset);
      }

      setNotes(draft.notes || '');
      setLatitude(draft.latitude);
      setLongitude(draft.longitude);
      setAccuracy(draft.accuracy);
      setAltitude(draft.altitude);

      if (draft.evidence) {
        const localUri = draft.evidence.localUri || draft.evidence.uri;
        const exists = await localEvidenceFileExists(localUri);

        if (exists) {
          applyEvidenceAsset({
            ...draft.evidence,
            uri: localUri,
            previewUri: localUri,
            localUri,
          });
        } else if (draft.evidence.remoteUrl) {
          applyEvidenceAsset({
            ...draft.evidence,
            uri: draft.evidence.remoteUrl,
            previewUri: draft.evidence.remoteUrl,
            uploadStatus: 'uploaded',
          });
        }
      }
    },
    [applyEvidenceAsset],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const authUser = await getAuthUser();
      const resolvedUserId = authUser?.id ?? null;
      const resolvedFarmerId = authUser?.farmer_profile?.id ?? null;
      setUserId(resolvedUserId);
      setFarmerId(resolvedFarmerId);

      const farmsData = await getFarmerMyFarms();
      const linkedFarms = extractList(farmsData as ApiRecord, ['farms']).map(mapLinkedFarm).filter((farm) => farm.farmId > 0);
      setFarms(linkedFarms);

      let nextFarmId = selectedFarmId ?? farmId ?? null;

      if (!nextFarmId && linkedFarms.length === 1) {
        nextFarmId = linkedFarms[0]?.farmId ?? null;
      }

      if (nextFarmId) {
        setSelectedFarmId(nextFarmId);
      }

      if (!resolvedFarmerId && linkedFarms[0]?.farmerId) {
        setFarmerId(linkedFarms[0].farmerId);
      }

      const farmerKey = resolvedFarmerId ?? linkedFarms[0]?.farmerId ?? 0;
      let hydratedFromServer = false;

      if (activityId) {
        const detail = await getFarmerFarmActivity(activityId);
        const activity = (detail.farm_activity ?? detail) as ApiRecord;
        setRecordId(Number(activity.id));
        setSelectedFarmId(Number(activity.farm_id));
        const storedDate = pickString(activity, 'activity_date', 'activityDate');
        if (storedDate && storedDate !== '-') {
          setActivityDate(storedDate);
          setDateLocked(true);
        }
        const storedCapturedAt = pickString(activity, 'captured_at');
        if (storedCapturedAt && storedCapturedAt !== '-') {
          setCapturedAt(storedCapturedAt);
        }
        const storedTimezone = pickString(activity, 'timezone');
        if (storedTimezone && storedTimezone !== '-') {
          setTimezone(storedTimezone);
        }
        const storedOffset = pickString(activity, 'utc_offset', 'utcOffset');
        if (storedOffset && storedOffset !== '-') {
          setUtcOffset(storedOffset);
        }
        setNotes(pickString(activity, 'notes') === '-' ? '' : pickString(activity, 'notes'));
        setLatitude(activity.latitude != null ? Number(activity.latitude) : null);
        setLongitude(activity.longitude != null ? Number(activity.longitude) : null);
        setAccuracy(activity.gps_accuracy != null ? Number(activity.gps_accuracy) : null);
        setAltitude(activity.altitude != null ? Number(activity.altitude) : null);
        setStatus((pickString(activity, 'status') as 'draft' | 'submitted') || 'draft');

        const remoteEvidence = remoteEvidenceFromActivity(activity);
        if (remoteEvidence) {
          applyEvidenceAsset(remoteEvidence);
        }

        hydratedFromServer = true;
      } else if (!dateLocked) {
        const now = new Date();
        setActivityDate(todayIsoDate());
        setCapturedAt(now.toISOString());
        setTimezone(deviceTimezone());
        setUtcOffset(deviceUtcOffset());
        setDateLocked(true);
      }

      const storageKey = buildFarmerFarmActivityDraftKey({
        userId: resolvedUserId,
        farmerId: farmerKey,
        farmId: nextFarmId ?? selectedFarmId,
        activityId: activityId ?? recordId,
      });
      const newKey = buildFarmerFarmActivityDraftKey({
        userId: resolvedUserId,
        farmerId: farmerKey,
        farmId: nextFarmId ?? selectedFarmId,
        activityId: null,
      });

      const localDraft =
        (await loadFarmerFarmActivityDraft(storageKey)) ??
        (!activityId ? await loadFarmerFarmActivityDraft(newKey) : null);

      if (localDraft) {
        if (localDraft.draftUuid) {
          setDraftUuid(localDraft.draftUuid);
        }

        if (!hydratedFromServer) {
          await hydrateLocalDraft(localDraft);
        } else if (localDraft.evidence) {
          const localUri = localDraft.evidence.localUri || localDraft.evidence.uri;
          if (await localEvidenceFileExists(localUri)) {
            applyEvidenceAsset({
              ...localDraft.evidence,
              uri: localUri,
              previewUri: localUri,
              localUri,
            });
          }
        }

        if (activityId && storageKey !== newKey) {
          await migrateFarmerFarmActivityDraft(newKey, storageKey);
        }
      }
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, 'Unable to load Farm Activity form.'));
    } finally {
      setLoading(false);
    }
  }, [
    activityId,
    applyEvidenceAsset,
    dateLocked,
    farmId,
    hydrateLocalDraft,
    recordId,
    selectedFarmId,
  ]);

  useEffect(() => {
    void load();
    // Initial load only — reload via reload().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, farmId]);

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

  const hasUsableEvidence = useCallback(async () => {
    const asset = evidenceAssetRef.current;

    if (!asset) {
      return false;
    }

    if (asset.uploadStatus === 'uploaded' && (asset.remoteUrl || asset.uri.startsWith('http'))) {
      return true;
    }

    const localUri = asset.localUri || asset.uri;

    return localEvidenceFileExists(localUri);
  }, []);

  const buildFormData = useCallback(
    async (forSubmit: boolean) => {
      if (!selectedFarmId) {
        throw new Error('Please select a linked farm.');
      }

      const formData = new FormData();
      formData.append('farm_id', String(selectedFarmId));
      formData.append('activity_date', activityDate);
      formData.append('captured_at', capturedAt);
      formData.append('timezone', timezone);
      formData.append('utc_offset', utcOffset);
      formData.append('notes', notes);
      formData.append('client_draft_uuid', draftUuid);

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

      const asset = evidenceAssetRef.current;
      const localUri = asset?.localUri || asset?.uri;
      const hasLocalFile = localUri ? await localEvidenceFileExists(localUri) : false;

      if (asset && hasLocalFile && asset.uploadStatus !== 'uploaded') {
        formData.append(
          'farm_activity_photo',
          {
            uri: localUri,
            name: asset.name,
            type: asset.type,
          } as unknown as Blob,
        );
        appendClientStampMetadata(formData, {
          capturedAt: asset.capturedAt,
          latitude: asset.latitude,
          longitude: asset.longitude,
          accuracy: asset.accuracy,
          village: asset.village || '',
          taluka: asset.taluka || '',
          district: asset.district || '',
          state: asset.state || '',
          watermark: {
            capturedAtLabel: formatEvidenceStampLabel(
              new Date(asset.capturedAt).getTime(),
            ),
          },
        });
      } else if (forSubmit && !(await hasUsableEvidence())) {
        throw new Error('Farm Activity Photo is required.');
      }

      return formData;
    },
    [
      accuracy,
      activityDate,
      altitude,
      capturedAt,
      draftUuid,
      hasUsableEvidence,
      latitude,
      longitude,
      notes,
      recordId,
      selectedFarm,
      selectedFarmId,
      timezone,
      utcOffset,
    ],
  );

  const submit = useCallback(async () => {
    if (submitting) {
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      const localDraft = await loadFarmerFarmActivityDraft(draftStorageKey);
      if (localDraft?.evidence && !evidenceAssetRef.current) {
        applyEvidenceAsset(localDraft.evidence);
      }
      if (localDraft?.activityId && !recordId) {
        setRecordId(localDraft.activityId);
      }

      if (latitude == null || longitude == null || accuracy == null) {
        throw new Error('GPS location with accuracy is required before submit.');
      }

      if (!(await hasUsableEvidence())) {
        throw new Error('Farm Activity Photo is required.');
      }

      const formData = await buildFormData(true);
      const response = await submitFarmerFarmActivity(formData);
      const activity = (response.farm_activity ?? response) as ApiRecord;
      const persistedId = Number(activity.id);
      const persistedStatus = String(activity.status ?? '');

      if (!Number.isFinite(persistedId) || persistedId <= 0) {
        throw new Error('Farm Activity could not be submitted. Your entered details and photo are still available. Please try again.');
      }

      if (persistedStatus !== 'submitted' && persistedStatus !== 'approved' && persistedStatus !== 'approved_with_remark') {
        throw new Error('Farm Activity could not be submitted. Your entered details and photo are still available. Please try again.');
      }

      setRecordId(persistedId);
      setStatus('submitted');

      await clearFarmerFarmActivityDraft(draftStorageKey);
      await clearFarmerFarmActivityDraft(
        buildFarmerFarmActivityDraftKey({
          userId,
          farmerId: farmerId ?? selectedFarm?.farmerId,
          farmId: selectedFarmId,
          activityId: null,
        }),
      );
      await clearFarmerFarmActivityDraft(
        buildFarmerFarmActivityDraftKey({
          userId,
          farmerId: farmerId ?? selectedFarm?.farmerId,
          farmId: selectedFarmId,
          activityId: persistedId,
        }),
      );
      await clearFarmerFarmActivityEvidenceDirectory({
        farmerId: farmerId ?? selectedFarm?.farmerId ?? 0,
        draftUuid,
      });

      return true;
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          'Farm Activity could not be submitted. Your entered details and photo are still available. Please try again.',
        ),
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [
    accuracy,
    applyEvidenceAsset,
    buildFormData,
    draftStorageKey,
    draftUuid,
    farmerId,
    hasUsableEvidence,
    latitude,
    longitude,
    recordId,
    selectedFarm?.farmerId,
    selectedFarmId,
    submitting,
    userId,
  ]);

  return {
    loading,
    submitting,
    error,
    farms,
    selectedFarm,
    selectedFarmId,
    setSelectedFarmId,
    activityDate,
    capturedAt,
    notes,
    setNotes,
    latitude,
    longitude,
    accuracy,
    altitude,
    capturingGps,
    captureGps,
    liveEvidence: {
      ...liveEvidence,
      captureEvidence,
      retakeEvidence,
      pickGalleryEvidence,
      confirmPending: () => {
        void confirmPendingEvidence();
      },
    },
    status,
    recordId,
    submit,
    reload: load,
  };
}
