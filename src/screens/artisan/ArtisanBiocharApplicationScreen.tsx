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
  searchArtisanFarms,
  submitArtisanBiocharApplication,
} from '../../api/artisanApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { FormSelect, type SelectOption } from '../../components/FormSelect';
import { EvidenceStampedImageFrame } from '../../components/evidence/EvidenceStampedImageFrame';
import { LiveWorkCheckinCard } from '../../components/artisan/LiveWorkCheckinCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import type { ArtisanStackParamList } from '../../navigation/types';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { captureBiocharGps, showBiocharPoorAccuracyWarning } from '../../utils/biocharGpsCapture';
import { formatFarmDisplayLabel, labelFarmsForFarmer } from '../../utils/farmDisplayLabel';
import { captureLivePhotoEvidence } from '../../utils/liveEvidenceCapture';
import type { ArtisanFarmSearchRecord } from '../../types/artisanFarmSearch';

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

type LabeledFarm = ArtisanFarmSearchRecord & { displayLabel: string };

type MixingRecord = {
  id: number;
  mixingCode: string;
  mixingDate: string;
  availableQuantity: number;
  unit: string;
  status: string;
};

function indiaDateTime(): { date: string; time: string; label: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
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
  const now = useMemo(indiaDateTime, []);
  const selectionSeededForFarmRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const searchInProgressRef = useRef(false);
  const loadingMixingRecordsRef = useRef(false);
  const submitInProgressRef = useRef(false);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtisanFarmSearchRecord[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<ApiRecord | null>(
    route.params?.farmerId
      ? {
          farmer_id: route.params.farmerId,
          farmer_code: route.params.farmerCode,
          farmer_name: route.params.farmerName,
        }
      : null,
  );
  const [labeledFarms, setLabeledFarms] = useState<LabeledFarm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(
    route.params?.farmId ? String(route.params.farmId) : '',
  );
  const [mixingRecords, setMixingRecords] = useState<MixingRecord[]>([]);
  const [selectedMixingIds, setSelectedMixingIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [gps, setGps] = useState<GpsState | null>(null);
  const [evidences, setEvidences] = useState<EvidenceAsset[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMixingRecords, setLoadingMixingRecords] = useState(false);
  const [submitted, setSubmitted] = useState<ApiRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const selectedFarm = useMemo(
    () => labeledFarms.find((farm) => String(farm.farm_id) === selectedFarmId) ?? null,
    [labeledFarms, selectedFarmId],
  );

  const farmId = selectedFarm?.farm_id ?? Number(route.params?.farmId ?? 0);
  const farmerId = selectedFarmer?.farmer_id != null
    ? Number(selectedFarmer.farmer_id)
    : selectedFarm?.farmer_id ?? Number(route.params?.farmerId ?? 0);

  const selectedMixings = useMemo(
    () => mixingRecords.filter((record) => selectedMixingIds.includes(record.id)),
    [mixingRecords, selectedMixingIds],
  );

  const selectedTotalQuantity = useMemo(
    () => Math.round(selectedMixings.reduce((sum, record) => sum + record.availableQuantity, 0) * 100) / 100,
    [selectedMixings],
  );

  const selectedUnit = selectedMixings[0]?.unit ?? 'kg';

  const farmOptions: SelectOption[] = labeledFarms.map((farm) => ({
    id: farm.farm_id,
    name: farm.displayLabel,
  }));

  const applyFarmerSelection = useCallback((records: ArtisanFarmSearchRecord[], farmerIdToSelect: number) => {
    const farmerRecords = records.filter((record) => record.farmer_id === farmerIdToSelect);
    const labeled = labelFarmsForFarmer(farmerRecords);
    const farmer = farmerRecords[0];

    if (!farmer) {
      return;
    }

    setSelectedFarmer({
      farmer_id: farmer.farmer_id,
      farmer_code: farmer.farmer_code,
      farmer_name: farmer.farmer_name,
    });
    setLabeledFarms(labeled);
    setSearchResults([]);
    selectionSeededForFarmRef.current = null;
    setMixingRecords([]);
    setSelectedMixingIds([]);

    if (labeled.length === 1) {
      setSelectedFarmId(String(labeled[0].farm_id));
      return;
    }

    setSelectedFarmId('');
  }, []);

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

  useEffect(() => {
    const seedFarmId = route.params?.farmId;
    const seedFarmerId = route.params?.farmerId;

    if (seedFarmId && seedFarmerId && labeledFarms.length === 0) {
      setLabeledFarms([
        {
          farm_id: seedFarmId,
          farmer_id: seedFarmerId,
          farm_code: route.params?.farmCode ?? null,
          farm_name: route.params?.farmName ?? route.params?.farmLabel ?? null,
          farmer_code: route.params?.farmerCode ?? null,
          farmer_name: route.params?.farmerName ?? null,
          village: route.params?.village ?? null,
          taluka: route.params?.taluka ?? null,
          district: route.params?.district ?? null,
          state: route.params?.state ?? null,
          displayLabel:
            route.params?.farmLabel ??
            formatFarmDisplayLabel({ village: route.params?.village }, 0),
        },
      ]);
      setSelectedFarmId(String(seedFarmId));
    }
  }, [
    labeledFarms.length,
    route.params?.district,
    route.params?.farmCode,
    route.params?.farmId,
    route.params?.farmLabel,
    route.params?.farmName,
    route.params?.farmerCode,
    route.params?.farmerId,
    route.params?.farmerName,
    route.params?.state,
    route.params?.taluka,
    route.params?.village,
  ]);

  const search = async () => {
    if (searchInProgressRef.current) {
      return;
    }

    if (!ensureCheckedInOrPrompt()) {
      return;
    }

    searchInProgressRef.current = true;
    setSearching(true);
    setError(null);

    try {
      const response = await searchArtisanFarms({ q: query.trim() || undefined, limit: 30 });
      const records = response.data ?? [];
      setSearchResults(records);

      if (records.length === 0) {
        setError(response.message || 'No farmers or farms found.');
        return;
      }

      const uniqueFarmers = new Map<number, ArtisanFarmSearchRecord>();
      for (const record of records) {
        if (!uniqueFarmers.has(record.farmer_id)) {
          uniqueFarmers.set(record.farmer_id, record);
        }
      }

      if (uniqueFarmers.size === 1) {
        applyFarmerSelection(records, [...uniqueFarmers.keys()][0]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to search farms.'));
      setSearchResults([]);
    } finally {
      if (mountedRef.current) {
        setSearching(false);
      }
      searchInProgressRef.current = false;
    }
  };

  const selectFarmerFromResults = (farmerIdToSelect: number) => {
    applyFarmerSelection(searchResults, farmerIdToSelect);
  };

  const selectFarm = (option: SelectOption) => {
    setSelectedFarmId(String(option.id));
    selectionSeededForFarmRef.current = null;
    setMixingRecords([]);
    setSelectedMixingIds([]);
  };

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

  const resetForm = () => {
    setSubmitted(null);
    setSelectedFarmer(null);
    setLabeledFarms([]);
    setSelectedFarmId('');
    setSearchResults([]);
    setMixingRecords([]);
    setSelectedMixingIds([]);
    selectionSeededForFarmRef.current = null;
    setNotes('');
    setGps(null);
    setEvidences([]);
    setError(null);
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

    const formData = new FormData();
    formData.append('farmer_id', String(farmerId));
    formData.append('farm_id', String(farmId));
    formData.append('application_date', now.date);
    formData.append('application_time', now.time);
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

    submitInProgressRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
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
          <Text style={styles.text}>
            Farm: {selectedFarm?.displayLabel ?? pickString(selectedFarm as ApiRecord | null, 'farm_code', 'farm_name')}
          </Text>
          <AppButton label="Start New Application" variant="secondary" onPress={resetForm} />
          <AppButton label="Go to Dashboard" variant="secondary" onPress={() => navigation.navigate('ArtisanDashboard')} />
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

        <Text style={styles.sectionTitle}>Search farmer / farm</Text>
        <View style={styles.row}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Farmer Name, Farmer ID, or Farm ID"
            style={styles.input}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => void search()}
          />
          <Pressable
            style={[styles.searchButton, searching && styles.buttonDisabled]}
            disabled={searching}
            onPress={() => void search()}
          >
            <Text style={styles.buttonText}>{searching ? 'Searching...' : 'Search'}</Text>
          </Pressable>
        </View>

        {searchResults.length > 0 ? (
          <>
            <Text style={styles.text}>Select a farmer from search results</Text>
            {Array.from(new Map(searchResults.map((record) => [record.farmer_id, record])).values()).map((record) => (
              <Pressable key={record.farmer_id} style={styles.card} onPress={() => selectFarmerFromResults(record.farmer_id)}>
                <Text style={styles.cardTitle}>{record.farmer_name ?? 'Farmer'}</Text>
                <Text style={styles.text}>Farmer ID: {record.farmer_code ?? record.farmer_id}</Text>
                <Text style={styles.text}>
                  {searchResults.filter((item) => item.farmer_id === record.farmer_id).length} farm(s)
                </Text>
              </Pressable>
            ))}
          </>
        ) : null}

        {selectedFarmer ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Selected farmer</Text>
            <Text style={styles.text}>{pickString(selectedFarmer, 'farmer_name')}</Text>
            <Text style={styles.text}>Farmer ID: {pickString(selectedFarmer, 'farmer_code', 'farmer_id')}</Text>
          </View>
        ) : null}

        {labeledFarms.length > 0 ? (
          <FormSelect
            label="Farm"
            placeholder="Select farm"
            value={selectedFarmId}
            displayValue={selectedFarm?.displayLabel}
            options={farmOptions}
            onSelect={selectFarm}
          />
        ) : null}

        {selectedFarm ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Selected farm</Text>
            <Text style={styles.text}>{selectedFarm.displayLabel}</Text>
            <Text style={styles.text}>
              {[selectedFarm.village, selectedFarm.taluka, selectedFarm.district].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}

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
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
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
  searchButton: { backgroundColor: artisanTheme.actionGreen, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: artisanTheme.white, fontWeight: '700' },
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
