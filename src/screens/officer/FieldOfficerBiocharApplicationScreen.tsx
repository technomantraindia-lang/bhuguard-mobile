import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

import {
  getOfficerBiocharApplicationEligibleBatches,
  searchOfficerBiocharApplicationFarms,
  submitOfficerBiocharApplication,
} from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerBiocharApplication'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerBiocharApplication'>;

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

export function FieldOfficerBiocharApplicationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const now = useMemo(indiaDateTime, []);
  const [query, setQuery] = useState('');
  const [farms, setFarms] = useState<ApiRecord[]>([]);
  const [farm, setFarm] = useState<ApiRecord | null>(
    route.params?.farmId
      ? {
          id: route.params.farmId,
          farmer_id: route.params.farmerId,
          farm_code: route.params.farmCode,
          farm_name: route.params.farmName,
          farmer_name: route.params.farmerName,
        }
      : null,
  );
  const [batches, setBatches] = useState<ApiRecord[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [evidences, setEvidences] = useState<{ uri: string; name: string; type: string; evidenceType: 'photo' | 'video' }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ApiRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const farmId = Number(farm?.id ?? 0);
  const mixingId = route.params?.mixingId;
  const preferredBatchIds = Array.isArray(route.params?.selectedBatchIds) ? route.params.selectedBatchIds : [];

  useEffect(() => {
    let mounted = true;

    const loadBatches = async () => {
      if (!farmId) {
        if (!route.params?.farmId) {
          setError('Required Farm or Batch information is missing.');
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getOfficerBiocharApplicationEligibleBatches(farmId, mixingId);
        const list = extractList(response, ['batches']);
        if (!mounted) {
          return;
        }

        setBatches(list);

        const nextQuantities: Record<number, string> = {};
        list.forEach((batch) => {
          const batchId = Number(batch.batch_id ?? batch.id);
          if (
            preferredBatchIds.length === 0 ||
            preferredBatchIds.includes(batchId) ||
            Number(batch.mixing_record_id) === Number(mixingId)
          ) {
            nextQuantities[batchId] = String(batch.available_quantity ?? '');
          }
        });
        setQuantities(nextQuantities);
      } catch (err) {
        if (mounted) {
          setError(getApiErrorMessage(err, 'Failed to load eligible batches.'));
          setBatches([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadBatches();

    return () => {
      mounted = false;
    };
  }, [farmId, mixingId, preferredBatchIds.join(','), route.params?.farmId]);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await searchOfficerBiocharApplicationFarms(query);
      setFarms(extractList(response, ['farms']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to search farms.'));
    } finally {
      setLoading(false);
    }
  };

  const selectFarm = (record: ApiRecord) => {
    setFarm(record);
    setBatches([]);
    setQuantities({});
    setFarms([]);
  };

  const addEvidence = async (evidenceType: 'photo' | 'video') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: evidenceType === 'photo' ? ['image/jpeg', 'image/png'] : ['video/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setEvidences((current) => [
        ...current,
        { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/octet-stream', evidenceType },
      ]);
    }
  };

  const submit = async () => {
    if (!farmId || !farm?.farmer_id) {
      setError('Select a farm and farmer first.');
      return;
    }

    const items = batches
      .map((batch) => ({
        batch_id: Number(batch.batch_id ?? batch.id),
        mixing_record_id: Number(batch.mixing_record_id) || undefined,
        quantity_applied: Number(quantities[Number(batch.batch_id ?? batch.id)]),
        unit: String(batch.unit ?? 'kg'),
        available_quantity: Number(batch.available_quantity ?? 0),
      }))
      .filter((item) => item.quantity_applied > 0);

    if (items.length === 0) {
      setError('Enter an applied quantity for at least one batch.');
      return;
    }

    if (items.some((item) => item.quantity_applied > item.available_quantity)) {
      setError('Applied quantity cannot exceed the available batch quantity.');
      return;
    }

    const formData = new FormData();
    formData.append('farmer_id', String(farm.farmer_id));
    formData.append('farm_id', String(farmId));
    formData.append('application_date', now.date);
    formData.append('application_time', now.time);
    formData.append('notes', notes);
    items.forEach((item, index) => {
      formData.append(`items[${index}][batch_id]`, String(item.batch_id));
      if (item.mixing_record_id) formData.append(`items[${index}][mixing_record_id]`, String(item.mixing_record_id));
      formData.append(`items[${index}][quantity_applied]`, String(item.quantity_applied));
      formData.append(`items[${index}][unit]`, item.unit);
    });
    evidences.forEach((evidence, index) => {
      formData.append(`evidences[${index}][file]`, { uri: evidence.uri, name: evidence.name, type: evidence.type } as unknown as Blob);
      formData.append(`evidences[${index}][evidence_type]`, evidence.evidenceType);
    });

    setLoading(true);
    setError(null);
    try {
      const response = await submitOfficerBiocharApplication(formData);
      setSubmitted((response.record ?? response) as ApiRecord);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Biochar application submission failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.title}>Biochar Application Submitted</Text>
          <Text style={styles.text}>Application: {pickString(submitted, 'application_code', 'id')}</Text>
          <AppButton label="View" onPress={() => navigation.goBack()} />
          <AppButton label="Dashboard" variant="secondary" onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Home' })} />
          <AppButton label="Start New Visit" variant="secondary" onPress={() => navigation.navigate('FieldOfficerCreateVisit', { farmerId: Number(farm?.farmer_id) })} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Biochar Application</Text>
        <Text style={styles.text}>Application time: {now.label} (Asia/Kolkata)</Text>
        <View style={styles.row}>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search farmer or farm" style={styles.input} />
          <Pressable style={styles.searchButton} onPress={() => void search()}><Text style={styles.buttonText}>Search</Text></Pressable>
        </View>
        {farms.map((record) => (
          <Pressable key={String(record.id)} style={styles.card} onPress={() => selectFarm(record)}>
            <Text style={styles.cardTitle}>{pickString(record, 'farm_name', 'farm_code')}</Text>
            <Text style={styles.text}>{pickString(record, 'farmer_name', 'farmer_code')}</Text>
          </Pressable>
        ))}
        {farm ? <Text style={styles.text}>Selected: {pickString(farm, 'farm_name', 'farm_code')} · {pickString(farm, 'farmer_name')}</Text> : null}
        {batches.map((batch) => {
          const batchId = Number(batch.batch_id ?? batch.id);
          return (
            <View key={batchId} style={styles.card}>
              <Text style={styles.cardTitle}>{pickString(batch, 'batch_code')}</Text>
              <Text style={styles.text}>Available: {String(batch.available_quantity ?? 0)} {String(batch.unit ?? 'kg')}</Text>
              <TextInput value={quantities[batchId] ?? ''} onChangeText={(value) => setQuantities((current) => ({ ...current, [batchId]: value }))} placeholder="Quantity applied" keyboardType="decimal-pad" style={styles.input} />
            </View>
          );
        })}
        <TextInput value={notes} onChangeText={setNotes} placeholder="Notes" multiline style={[styles.input, styles.notes]} />
        <View style={styles.row}>
          <AppButton label="Add Photo" variant="secondary" onPress={() => void addEvidence('photo')} />
          <AppButton label="Add Video" variant="secondary" onPress={() => void addEvidence('video')} />
        </View>
        {evidences.map((evidence) => <Text key={`${evidence.uri}-${evidence.name}`} style={styles.text}>{evidence.evidenceType}: {evidence.name}</Text>)}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton label={loading ? 'Submitting…' : 'Submit'} disabled={loading} onPress={() => void submit()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { gap: 12, padding: 16, paddingBottom: 36 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  text: { color: colors.textMuted },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { borderColor: colors.border, borderRadius: 8, borderWidth: 1, color: colors.text, flex: 1, minHeight: 44, padding: 10 },
  notes: { minHeight: 96, textAlignVertical: 'top' },
  searchButton: { backgroundColor: colors.primary, borderRadius: 8, padding: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, gap: 6, padding: 12 },
  cardTitle: { color: colors.text, fontWeight: '700' },
  error: { color: colors.error },
});
