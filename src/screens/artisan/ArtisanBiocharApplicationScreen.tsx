import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  getArtisanBiocharApplicationEligibleBatches,
  getArtisanBiocharMixingRecords,
  submitArtisanBiocharApplication,
} from '../../api/artisanApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { EvidenceStampedImageFrame } from '../../components/evidence/EvidenceStampedImageFrame';
import { LiveWorkCheckinCard } from '../../components/artisan/LiveWorkCheckinCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import type { ArtisanStackParamList } from '../../navigation/types';
import {
  buildTimeAuditMetadata,
  getServerSyncedNow,
  shouldBlockOfflineTimestampSubmit,
} from '../../services/serverTimeSync';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { captureBiocharGps, showBiocharPoorAccuracyWarning } from '../../utils/biocharGpsCapture';
import { formatFarmDisplayLabel } from '../../utils/farmDisplayLabel';
import { captureLivePhotoEvidence } from '../../utils/liveEvidenceCapture';
import { safeNetInfoIsConnected } from '../../utils/safeNetInfo';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanBiocharApplication'>;
type ScreenRoute = RouteProp<ArtisanStackParamList, 'ArtisanBiocharApplication'>;

type EvidenceAsset = {
  uri: string;
  name: string;
  type: string;
  evidenceType: 'photo' | 'video';
  captureKind: 'live_photo' | 'live_video' | 'uploaded_video';
  capturedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type GpsState = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
};

interface SelectedFarmInfo {
  farmId: number;
  farmerId: number;
  farmerCode: string | null;
  farmerName: string | null;
  farmCode: string | null;
  farmLabel: string;
  village: string | null;
  taluka: string | null;
  district: string | null;
  state: string | null;
}

type MixingRecord = {
  id: number;
  mixingCode: string;
  mixingDate: string;
  availableQuantity: number;
  unit: string;
  status: string;
};

function indiaDateTime(from: Date = getServerSyncedNow()): { date: string; time: string; label: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(from);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    time: `${value('hour')}:${value('minute')}`,
    label: `${value('day')}/${value('month')}/${value('year')} ${value('hour')}:${value('minute')} IST`,
  };
}

function mapMixingRecord(raw: ApiRecord, availableByMixing: Map<number, { qty: number; unit: string }>): MixingRecord | null {
  const id = Number(raw.id ?? raw.mixing_id ?? 0);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const status = pickString(raw, 'status');
  if (status !== 'submitted' && status !== 'completed') {
    return null;
  }

  const available = availableByMixing.get(id);
  const availableQuantity = available?.qty ?? 0;
  if (availableQuantity <= 0) {
    return null;
  }

  return {
    id,
    mixingCode:
      pickString(raw, 'mixing_record_id', 'mixing_code', 'mixingCode') !== '-'
        ? pickString(raw, 'mixing_record_id', 'mixing_code', 'mixingCode')
        : String(id),
    mixingDate:
      pickString(raw, 'date_of_mixing', 'mixing_date', 'dateOfMixing') !== '-'
        ? pickString(raw, 'date_of_mixing', 'mixing_date', 'dateOfMixing')
        : '',
    availableQuantity,
    unit: available?.unit || (pickString(raw, 'unit') !== '-' ? pickString(raw, 'unit') : 'kg'),
    status,
  };
}

export function ArtisanBiocharApplicationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { ensureCheckedInOrPrompt } = useArtisanWorkSession();
  const now = useMemo(() => indiaDateTime(), []);
  const selectionSeededForFarmRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const loadingMixingRecordsRef = useRef(false);
  const submitInProgressRef = useRef(false);

  // Farmer + farm are always chosen upstream in the Farmer list → Farms flow
  // (ArtisanFarmLookupScreen, purpose="application") before we get here.
  const selectedFarm: SelectedFarmInfo | null = useMemo(() => {
    if (!route.params?.farmId || !route.params?.farmerId) {
      return null;
    }

    return {
      farmId: route.params.farmId,
      farmerId: route.params.farmerId,
      farmerCode: route.params.farmerCode ?? null,
      farmerName: route.params.farmerName ?? null,
      farmCode: route.params.farmCode ?? null,
      farmLabel:
        route.params.farmLabel ??
        route.params.farmName ??
        formatFarmDisplayLabel({ village: route.params.village }, 0),
      village: route.params.village ?? null,
      taluka: route.params.taluka ?? null,
      district: route.params.district ?? null,
      state: route.params.state ?? null,
    };
  }, [
    route.params?.farmCode,
    route.params?.farmId,
    route.params?.farmLabel,
    route.params?.farmName,
    route.params?.farmerCode,
    route.params?.farmerId,
    route.params?.farmerName,
    route.params?.district,
    route.params?.state,
    route.params?.taluka,
    route.params?.village,
  ]);

  const [mixingRecords, setMixingRecords] = useState<MixingRecord[]>([]);
  const [selectedMixingIds, setSelectedMixingIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [gps, setGps] = useState<GpsState | null>(null);
  const [evidences, setEvidences] = useState<EvidenceAsset[]>([]);
  const [loadingMixingRecords, setLoadingMixingRecords] = useState(false);
  const [submitted, setSubmitted] = useState<ApiRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const farmId = selectedFarm?.farmId ?? 0;
  const farmerId = selectedFarm?.farmerId ?? 0;

  const selectedMixings = useMemo(
    () => mixingRecords.filter((record) => selectedMixingIds.includes(record.id)),
    [mixingRecords, selectedMixingIds],
  );

  const selectedTotalQuantity = useMemo(
    () => Math.round(selectedMixings.reduce((sum, record) => sum + record.availableQuantity, 0) * 100) / 100,
    [selectedMixings],
  );

  const selectedUnit = selectedMixings[0]?.unit ?? 'kg';

  const loadMixingRecords = useCallback(async (farmIdForMixing: number) => {
    if (loadingMixingRecordsRef.current) {
      return;
    }

    loadingMixingRecordsRef.current = true;
    setLoadingMixingRecords(true);
    setError(null);

    try {
      const [mixingResponse, eligibleResponse] = await Promise.all([
        getArtisanBiocharMixingRecords('submitted') as Promise<ApiRecord>,
        getArtisanBiocharApplicationEligibleBatches(farmIdForMixing),
      ]);

      const availableByMixing = new Map<number, { qty: number; unit: string }>();
      for (const batch of extractList(eligibleResponse as ApiRecord, ['batches'])) {
        const mixingId = Number(batch.mixing_record_id ?? 0);
        const qty = Number(batch.available_quantity ?? batch.availableQuantity ?? 0);
        if (!Number.isFinite(mixingId) || mixingId <= 0 || qty <= 0) {
          continue;
        }
        const existing = availableByMixing.get(mixingId);
        availableByMixing.set(mixingId, {
          qty: Math.round(((existing?.qty ?? 0) + qty) * 100) / 100,
          unit: pickString(batch, 'unit') !== '-' ? pickString(batch, 'unit') : existing?.unit || 'kg',
        });
      }

      const list = extractList(mixingResponse, ['mixing_records', 'records']);
      const mapped = list
        .filter((record) => Number(record.farm_id ?? record.farmId) === farmIdForMixing)
        .map((record) => mapMixingRecord(record, availableByMixing))
        .filter((record): record is MixingRecord => record != null);

      if (!mountedRef.current) {
        return;
      }

      setMixingRecords(mapped);

      if (selectionSeededForFarmRef.current !== farmIdForMixing) {
        setSelectedMixingIds(mapped.map((record) => record.id));
        selectionSeededForFarmRef.current = farmIdForMixing;
      } else {
        setSelectedMixingIds((current) => current.filter((id) => mapped.some((record) => record.id === id)));
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setMixingRecords([]);
      setSelectedMixingIds([]);
      setError(getApiErrorMessage(err, 'Failed to load mixing records for this farm.'));
    } finally {
      if (mountedRef.current) {
        setLoadingMixingRecords(false);
      }
      loadingMixingRecordsRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!farmId) {
      return;
    }

    void loadMixingRecords(farmId);
  }, [farmId, loadMixingRecords]);

  const toggleMixing = (mixingId: number) => {
    setSelectedMixingIds((current) =>
      current.includes(mixingId) ? current.filter((id) => id !== mixingId) : [...current, mixingId],
    );
  };

  const selectAllMixings = () => {
    setSelectedMixingIds(mixingRecords.map((record) => record.id));
  };

  const clearMixingSelection = () => {
    setSelectedMixingIds([]);
  };

  const captureGps = async () => {
    try {
      const capture = await captureBiocharGps();
      setGps({
        latitude: capture.latitude,
        longitude: capture.longitude,
        accuracy: capture.accuracyM,
        altitude: capture.altitude,
        village: capture.village,
        taluka: capture.taluka,
        district: capture.district,
        state: capture.state,
      });

      if (capture.isPoorAccuracy) {
        showBiocharPoorAccuracyWarning();
      }
    } catch (err) {
      Alert.alert('GPS unavailable', getApiErrorMessage(err, 'Unable to capture current GPS location.'));
    }
  };

  const captureLivePhoto = async () => {
    const result = await captureLivePhotoEvidence();
    if (!result.ok) {
      return;
    }

    const captured = result.evidence;
    setEvidences((current) => [
      ...current,
      {
        uri: captured.previewUri,
        name: captured.name,
        type: captured.type,
        evidenceType: 'photo',
        captureKind: 'live_photo',
        capturedAt: captured.capturedAt,
        latitude: captured.latitude,
        longitude: captured.longitude,
      },
    ]);
  };

  const captureLiveVideo = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to capture a live video.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 60,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    setEvidences((current) => [
      ...current,
      {
        uri: asset.uri,
        name: asset.fileName ?? `application-live-video-${Date.now()}.mp4`,
        type: asset.mimeType ?? 'video/mp4',
        evidenceType: 'video',
        captureKind: 'live_video',
        capturedAt: new Date().toISOString(),
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
      },
    ]);
  };

  const uploadVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['video/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'video/mp4';
    if (!mimeType.startsWith('video/')) {
      Alert.alert('Invalid file', 'Please select a supported video file.');
      return;
    }

    setEvidences((current) => [
      ...current,
      {
        uri: asset.uri,
        name: asset.name || `application-upload-video-${Date.now()}.mp4`,
        type: mimeType,
        evidenceType: 'video',
        captureKind: 'uploaded_video',
      },
    ]);
  };

  const removeEvidence = (index: number) => {
    setEvidences((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const openEvidencePreview = (uri: string) => {
    navigation.navigate('FullscreenImage', { uri, title: 'Application Evidence' });
  };

  /** "Add New" always returns to the Farmer list — never reopens this farm's form in place. */
  const goToFarmerList = () => {
    navigation.replace('ArtisanFarmLookup', { purpose: 'application' });
  };

  const submit = async () => {
    if (submitInProgressRef.current) {
      return;
    }

    if (!ensureCheckedInOrPrompt()) {
      return;
    }

    if (!farmId || !farmerId) {
      setError('Select a farmer and farm first.');
      return;
    }

    if (selectedMixingIds.length === 0) {
      setError('Select at least one Mixing record before submitting.');
      return;
    }

    if (!gps) {
      setError('Capture current GPS location before submitting.');
      return;
    }

    if (evidences.length === 0) {
      setError('Add at least one photo or video evidence before submitting.');
      return;
    }

    submitInProgressRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const isOnline = await safeNetInfoIsConnected();
      if (shouldBlockOfflineTimestampSubmit(isOnline)) {
        throw new Error(
          'Cannot submit offline right now. This step records a timestamp and needs a recent server time sync. Reconnect to the internet, retry sync, and try again.',
        );
      }

      // Prefer server-synced IST for application_date/time; audit is local-only
      // (validated FormData contract does not accept device_utc / server_utc).
      const submitNow = indiaDateTime(getServerSyncedNow());
      buildTimeAuditMetadata('artisan_biochar_application_submit', {
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracyM: gps.accuracy,
      });

      const formData = new FormData();
      formData.append('farmer_id', String(farmerId));
      formData.append('farm_id', String(farmId));
      formData.append('application_date', submitNow.date);
      formData.append('application_time', submitNow.time);
      formData.append('notes', notes.trim());
      formData.append('latitude', String(gps.latitude));
      formData.append('longitude', String(gps.longitude));
      formData.append('application_quantity', String(selectedTotalQuantity));
      if (gps.accuracy != null) {
        formData.append('accuracy', String(gps.accuracy));
      }
      if (gps.altitude != null) {
        formData.append('altitude', String(gps.altitude));
      }
      formData.append('village', gps.village ?? selectedFarm?.village ?? '');
      formData.append('taluka', gps.taluka ?? selectedFarm?.taluka ?? '');
      formData.append('district', gps.district ?? selectedFarm?.district ?? '');
      formData.append('state', gps.state ?? selectedFarm?.state ?? '');

      selectedMixingIds.forEach((mixingId, index) => {
        formData.append(`mixing_record_ids[${index}]`, String(mixingId));
      });

      evidences.forEach((evidence, index) => {
        formData.append(`evidences[${index}][file]`, {
          uri: evidence.uri,
          name: evidence.name,
          type: evidence.type,
        } as unknown as Blob);
        formData.append(`evidences[${index}][evidence_type]`, evidence.evidenceType);
        if (evidence.capturedAt) {
          formData.append(`evidences[${index}][captured_at]`, evidence.capturedAt);
        }
        formData.append(
          `evidences[${index}][latitude]`,
          String(evidence.latitude ?? gps.latitude),
        );
        formData.append(
          `evidences[${index}][longitude]`,
          String(evidence.longitude ?? gps.longitude),
        );
        if (gps.accuracy != null) {
          formData.append(`evidences[${index}][accuracy]`, String(gps.accuracy));
        }
      });

      const response = await submitArtisanBiocharApplication(formData);
      setSubmitted((response.record ?? response) as ApiRecord);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Biochar application submission failed.'));
    } finally {
      if (mountedRef.current) {
        setSubmitting(false);
      }
      submitInProgressRef.current = false;
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Biochar Application" showBrandLogo={false} />
        <View style={styles.content}>
          <Text style={styles.title}>Biochar Application Submitted Successfully</Text>
          <Text style={styles.text}>Application: {pickString(submitted, 'application_code', 'id')}</Text>
          <Text style={styles.text}>Farm: {selectedFarm?.farmLabel ?? '—'}</Text>
          <AppButton label="Add New (Back to Farmer List)" variant="secondary" onPress={goToFarmerList} />
          <AppButton label="Go to Dashboard" variant="secondary" onPress={() => navigation.navigate('ArtisanDashboard')} />
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedFarm) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Biochar Application" showBrandLogo={false} />
        <View style={styles.content}>
          <Text style={styles.title}>No farm selected</Text>
          <Text style={styles.text}>
            Select a farmer and farm from the Farmer list before starting a Biochar Application.
          </Text>
          <AppButton label="Go to Farmer List" onPress={goToFarmerList} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Biochar Application" showBrandLogo={false} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LiveWorkCheckinCard />
        <Text style={styles.sectionTitle}>Current date & time</Text>
        <Text style={styles.text}>{now.label}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farmer</Text>
          <Text style={styles.text}>{selectedFarm.farmerName ?? 'Farmer'}</Text>
          <Text style={styles.text}>Farmer ID: {selectedFarm.farmerCode ?? selectedFarm.farmerId}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farm</Text>
          <Text style={styles.text}>
            Farm Name: {selectedFarm.farmLabel || selectedFarm.farmCode || `Farm ${selectedFarm.farmId}`}
          </Text>
          <Text style={styles.text}>Farm ID: {selectedFarm.farmCode || selectedFarm.farmId || '—'}</Text>
          <Text style={styles.text}>Village: {selectedFarm.village?.trim() || '—'}</Text>
        </View>

        {farmId ? (
          <>
            <Text style={styles.sectionTitle}>Mixing Records for this Farm</Text>
            {mixingRecords.length > 0 ? (
              <View style={styles.rowWrap}>
                <AppButton label="Select All" variant="secondary" onPress={selectAllMixings} />
                <AppButton label="Clear Selection" variant="secondary" onPress={clearMixingSelection} />
              </View>
            ) : null}
            {loadingMixingRecords && mixingRecords.length === 0 ? (
              <Text style={styles.text}>Loading mixing records...</Text>
            ) : null}
            {!loadingMixingRecords && mixingRecords.length === 0 ? (
              <Text style={styles.text}>No eligible mixing records for this farm.</Text>
            ) : null}
            {mixingRecords.map((mixing) => {
              const selected = selectedMixingIds.includes(mixing.id);
              return (
                <Pressable
                  key={mixing.id}
                  style={[styles.card, selected && styles.cardSelected]}
                  onPress={() => toggleMixing(mixing.id)}
                >
                  <Text style={styles.line}>{selected ? '☑' : '☐'} Mixing ID: {mixing.mixingCode}</Text>
                  <Text style={styles.text}>Mixing Date: {mixing.mixingDate || '—'}</Text>
                  <Text style={styles.text}>
                    Available Quantity: {mixing.availableQuantity} {mixing.unit}
                  </Text>
                  <Text style={styles.text}>Status: {selected ? 'Selected' : mixing.status}</Text>
                </Pressable>
              );
            })}
            <Text style={styles.text}>
              Total Selected Quantity: {selectedTotalQuantity} {selectedUnit}
            </Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Application notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Message / application notes"
          multiline
          style={[styles.input, styles.notes]}
        />

        <Text style={styles.sectionTitle}>GPS location</Text>
        <AppButton label={gps ? 'Recapture GPS' : 'Capture Current GPS'} variant="secondary" onPress={() => void captureGps()} />
        {gps ? (
          <Text style={styles.text}>
            {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
            {gps.accuracy != null ? ` · ±${Math.round(gps.accuracy)}m` : ''}
          </Text>
        ) : (
          <Text style={styles.text}>GPS not captured yet.</Text>
        )}

        <Text style={styles.sectionTitle}>Evidence</Text>
        <View style={styles.rowWrap}>
          <AppButton label="Add Live Photo" variant="secondary" onPress={() => void captureLivePhoto()} />
          <AppButton label="Add Live Video" variant="secondary" onPress={() => void captureLiveVideo()} />
          <AppButton label="Upload Video" variant="secondary" onPress={() => void uploadVideo()} />
        </View>

        {evidences.map((evidence, index) => (
          <View key={`${evidence.uri}-${index}`} style={styles.evidenceCard}>
            {evidence.evidenceType === 'photo' ? (
              <EvidenceStampedImageFrame
                uri={evidence.uri}
                compact
                onPress={() => openEvidencePreview(evidence.uri)}
              />
            ) : (
              <Text style={styles.text}>
                {evidence.captureKind === 'uploaded_video' ? 'Uploaded Video' : 'Live Video'}: {evidence.name}
              </Text>
            )}
            <Pressable onPress={() => removeEvidence(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton
          label={submitting ? 'Submitting...' : 'Submit Biochar Application'}
          disabled={submitting}
          onPress={() => void submit()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  content: { gap: 12, padding: spacing.lg, paddingBottom: 40 },
  title: { color: artisanTheme.deepText, fontSize: 22, fontWeight: '800' },
  sectionTitle: { color: artisanTheme.deepText, fontSize: 16, fontWeight: '800', marginTop: 4 },
  text: { color: artisanTheme.secondaryText, fontSize: 13, lineHeight: 18 },
  line: { color: artisanTheme.deepText, fontSize: 14, fontWeight: '600' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    backgroundColor: artisanTheme.white,
    borderColor: artisanTheme.softBorder,
    borderRadius: 10,
    borderWidth: 1,
    color: artisanTheme.deepText,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notes: { minHeight: 96, textAlignVertical: 'top' },
  card: {
    backgroundColor: artisanTheme.white,
    borderColor: artisanTheme.softBorder,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12,
    ...artisanTheme.cardShadow,
  },
  cardSelected: { borderColor: artisanTheme.actionGreen, borderWidth: 2 },
  cardTitle: { color: artisanTheme.deepText, fontSize: 15, fontWeight: '800' },
  evidenceCard: { gap: 8 },
  removeText: { color: '#B91C1C', fontWeight: '700' },
  error: { color: '#B91C1C', fontWeight: '600' },
});
