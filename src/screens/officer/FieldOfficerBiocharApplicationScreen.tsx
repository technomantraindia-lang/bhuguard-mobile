import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';

import {
  getFieldOfficerFarmerFarms,
  getFieldOfficerFarmers,
  getOfficerFarmerBiocharMixingRecords,
  getOfficerBiocharApplicationEligibleBatches,
  submitOfficerBiocharApplication,
} from '../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../api/authApi';
import { AppButton } from '../../components/AppButton';
import { KeyboardSafeScrollView } from '../../components/layout/KeyboardSafeScrollView';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import {
  buildTimeAuditMetadata,
  getServerSyncedNow,
  shouldBlockOfflineTimestampSubmit,
} from '../../services/serverTimeSync';
import { colors } from '../../theme/colors';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatFarmerDisplayId } from '../../utils/displayIds';
import { formatFarmDisplayCode } from '../../utils/entityId';
import { safeNetInfoIsConnected } from '../../utils/safeNetInfo';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerBiocharApplication'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerBiocharApplication'>;

type Step = 'farmers' | 'farms' | 'mixing' | 'submit';

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

/**
 * Phase 18: Farmer list → Farms → Mixing selection → submit.
 * Free-text Search removed; Add New returns to the Farmer list.
 */
export function FieldOfficerBiocharApplicationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const now = useMemo(() => indiaDateTime(), []);
  const deepLinkMixingAdvancedRef = useRef(false);

  const [step, setStep] = useState<Step>(
    route.params?.farmId && route.params?.farmerId ? 'mixing' : 'farmers',
  );
  const [farmers, setFarmers] = useState<ApiRecord[]>([]);
  const [farms, setFarms] = useState<ApiRecord[]>([]);
  const [mixings, setMixings] = useState<ApiRecord[]>([]);
  const [farmer, setFarmer] = useState<ApiRecord | null>(
    route.params?.farmerId
      ? {
          id: route.params.farmerId,
          farmer_name: route.params.farmerName,
          farmer_code: undefined,
        }
      : null,
  );
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
  const [mixingId, setMixingId] = useState<number | undefined>(
    route.params?.mixingId ? Number(route.params.mixingId) : undefined,
  );
  const [batches, setBatches] = useState<ApiRecord[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [evidences, setEvidences] = useState<
    { uri: string; name: string; type: string; evidenceType: 'photo' | 'video' }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ApiRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const farmId = Number(farm?.id ?? 0);
  const farmerId = Number(farmer?.id ?? farm?.farmer_id ?? 0);
  const preferredBatchIds = Array.isArray(route.params?.selectedBatchIds)
    ? route.params.selectedBatchIds
    : [];

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFieldOfficerFarmers();
      setFarmers(extractList(response as ApiRecord, ['farmers', 'data']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farmers.'));
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === 'farmers') {
      void loadFarmers();
    }
  }, [loadFarmers, step]);

  const loadMixingsForFarm = useCallback(async (farmerIdForLoad: number, farmIdForLoad: number) => {
    const response = await getOfficerFarmerBiocharMixingRecords(farmerIdForLoad);
    const list = extractList(response as ApiRecord, ['mixings', 'records', 'data']);
    return list.filter((item) => {
      const itemFarmId = Number(item.farm_id ?? item.farmId ?? 0);
      return !itemFarmId || itemFarmId === farmIdForLoad;
    });
  }, []);

  // Deep-link / resume: when route lands on mixing (farmerId+farmId), load mixings
  // the same way selectFarm does. Prefer advancing to submit when mixingId is set.
  useEffect(() => {
    let mounted = true;

    const loadDeepLinkMixings = async () => {
      if (step !== 'mixing' || !farmerId || !farmId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const forFarm = await loadMixingsForFarm(farmerId, farmId);
        if (!mounted) {
          return;
        }

        setMixings(forFarm);

        const preferredMixingId = route.params?.mixingId != null ? Number(route.params.mixingId) : undefined;
        const routeMatchesCurrent =
          Number(route.params?.farmerId) === farmerId && Number(route.params?.farmId) === farmId;

        if (
          !deepLinkMixingAdvancedRef.current &&
          routeMatchesCurrent &&
          preferredMixingId != null &&
          Number.isFinite(preferredMixingId) &&
          preferredMixingId > 0
        ) {
          deepLinkMixingAdvancedRef.current = true;
          setMixingId(preferredMixingId);
          setStep('submit');
        }
      } catch (err) {
        if (mounted) {
          setError(getApiErrorMessage(err, 'Failed to load mixing records.'));
          setMixings([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDeepLinkMixings();

    return () => {
      mounted = false;
    };
  }, [farmId, farmerId, loadMixingsForFarm, route.params?.mixingId, step]);

  useEffect(() => {
    let mounted = true;

    const loadBatches = async () => {
      if (!farmId || step !== 'submit') {
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
  }, [farmId, mixingId, preferredBatchIds.join(','), step]);

  const selectFarmer = async (record: ApiRecord) => {
    const id = Number(record.id ?? record.farmer_id);
    if (!id) {
      setError('Invalid farmer record.');
      return;
    }

    setFarmer(record);
    setFarm(null);
    setMixingId(undefined);
    setBatches([]);
    setQuantities({});
    setLoading(true);
    setError(null);

    try {
      const response = await getFieldOfficerFarmerFarms(id);
      const list = Array.isArray(response)
        ? (response as unknown as ApiRecord[])
        : extractList(response as ApiRecord, ['farms', 'data']);
      setFarms(list);
      setStep('farms');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farms for farmer.'));
      setFarms([]);
    } finally {
      setLoading(false);
    }
  };

  const selectFarm = async (record: ApiRecord) => {
    const id = Number(record.id ?? record.farm_id);
    if (!id || !farmerId) {
      setError('Select a valid farm.');
      return;
    }

    setFarm({ ...record, id, farmer_id: farmerId });
    setMixingId(undefined);
    setBatches([]);
    setQuantities({});
    setMixings([]);
    setError(null);
    // Step → mixing triggers the shared loadMixingsForFarm effect (same as deep-link).
    setStep('mixing');
  };

  const selectMixing = (record: ApiRecord | null) => {
    const id = record ? Number(record.id ?? record.mixing_id ?? record.mixing_record_id) : undefined;
    setMixingId(id && Number.isFinite(id) ? id : undefined);
    setStep('submit');
  };

  const resetToFarmers = () => {
    setStep('farmers');
    setFarmer(null);
    setFarm(null);
    setFarms([]);
    setMixings([]);
    setMixingId(undefined);
    setBatches([]);
    setQuantities({});
    setNotes('');
    setEvidences([]);
    setSubmitted(null);
    setError(null);
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
        {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? 'application/octet-stream',
          evidenceType,
        },
      ]);
    }
  };

  const submit = async () => {
    if (!farmId || !farmerId) {
      setError('Select a farmer and farm first.');
      return;
    }

    const items = batches
      .map((batch) => ({
        batch_id: Number(batch.batch_id ?? batch.id),
        mixing_record_id: Number(batch.mixing_record_id) || mixingId || undefined,
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

    setLoading(true);
    setError(null);

    try {
      const isOnline = await safeNetInfoIsConnected();
      if (shouldBlockOfflineTimestampSubmit(isOnline)) {
        throw new Error(
          'Cannot submit offline right now. This step records a timestamp and needs a recent server time sync. Reconnect to the internet, retry sync, and try again.',
        );
      }

      // Prefer server-synced IST wall clock for application_date/time; audit stays local
      // (API FormData contract does not accept device_utc / server_utc fields).
      const submitNow = indiaDateTime(getServerSyncedNow());
      buildTimeAuditMetadata('field_officer_biochar_application_submit');

      const formData = new FormData();
      formData.append('farmer_id', String(farmerId));
      formData.append('farm_id', String(farmId));
      formData.append('application_date', submitNow.date);
      formData.append('application_time', submitNow.time);
      formData.append('notes', notes);
      items.forEach((item, index) => {
        formData.append(`items[${index}][batch_id]`, String(item.batch_id));
        if (item.mixing_record_id) {
          formData.append(`items[${index}][mixing_record_id]`, String(item.mixing_record_id));
        }
        formData.append(`items[${index}][quantity_applied]`, String(item.quantity_applied));
        formData.append(`items[${index}][unit]`, item.unit);
      });
      evidences.forEach((evidence, index) => {
        formData.append(
          `evidences[${index}][file]`,
          { uri: evidence.uri, name: evidence.name, type: evidence.type } as unknown as Blob,
        );
        formData.append(`evidences[${index}][evidence_type]`, evidence.evidenceType);
      });

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
        <ScreenHeader title="Biochar Application" showBrandLogo={false} />
        <View style={styles.content}>
          <Text style={styles.title}>Biochar Application Submitted</Text>
          <Text style={styles.text}>Application: {pickString(submitted, 'application_code', 'id')}</Text>
          <AppButton label="Add New Application" onPress={resetToFarmers} />
          <AppButton
            label="Dashboard"
            variant="secondary"
            onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Home' })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Biochar Application" showBrandLogo={false} />
      <KeyboardSafeScrollView contentContainerStyle={styles.content} extraBottomPadding={24}>
        <Text style={styles.text}>Application time: {now.label} (Asia/Kolkata)</Text>
        <Text style={styles.stepHint}>
          {step === 'farmers'
            ? '1. Select Farmer'
            : step === 'farms'
              ? '2. Select Farm'
              : step === 'mixing'
                ? '3. Select Mixing record'
                : '4. Apply quantities & submit'}
        </Text>

        {step === 'farmers' ? (
          <>
            {farmers.map((record) => {
              const id = Number(record.id ?? record.farmer_id);
              return (
                <Pressable key={String(id)} style={styles.card} onPress={() => void selectFarmer(record)}>
                  <Text style={styles.cardTitle}>
                    {pickString(record, 'farmer_name', 'name')}
                  </Text>
                  <Text style={styles.text}>Farmer ID: {formatFarmerDisplayId(record)}</Text>
                </Pressable>
              );
            })}
            {!loading && farmers.length === 0 ? (
              <Text style={styles.text}>No farmers available in your assigned area.</Text>
            ) : null}
          </>
        ) : null}

        {step === 'farms' ? (
          <>
            <Pressable onPress={() => setStep('farmers')}>
              <Text style={styles.backLink}>← Back to farmers</Text>
            </Pressable>
            <Text style={styles.text}>
              Farmer: {pickString(farmer ?? {}, 'farmer_name', 'name')} ·{' '}
              {formatFarmerDisplayId(farmer)}
            </Text>
            {farms.map((record) => {
              const id = Number(record.id ?? record.farm_id);
              return (
                <Pressable key={String(id)} style={styles.card} onPress={() => void selectFarm(record)}>
                  <Text style={styles.cardTitle}>
                    {pickString(record, 'farm_name', 'name') !== '-'
                      ? pickString(record, 'farm_name', 'name')
                      : formatFarmDisplayCode(
                          Number(record.id ?? record.farm_id),
                          pickString(record, 'farm_code', 'farmCode') !== '-'
                            ? pickString(record, 'farm_code', 'farmCode')
                            : null,
                        )}
                  </Text>
                  <Text style={styles.text}>
                    Farm ID:{' '}
                    {formatFarmDisplayCode(
                      Number(record.id ?? record.farm_id),
                      pickString(record, 'farm_code', 'farmCode') !== '-'
                        ? pickString(record, 'farm_code', 'farmCode')
                        : null,
                    )}
                  </Text>
                </Pressable>
              );
            })}
            {!loading && farms.length === 0 ? (
              <Text style={styles.text}>No farms found for this farmer.</Text>
            ) : null}
          </>
        ) : null}

        {step === 'mixing' ? (
          <>
            <Pressable onPress={() => setStep('farms')}>
              <Text style={styles.backLink}>← Back to farms</Text>
            </Pressable>
            <Text style={styles.text}>
              Farm: {pickString(farm ?? {}, 'farm_name', 'farm_code')} ·{' '}
              {formatFarmDisplayCode(
                Number(farm?.id ?? 0),
                pickString(farm ?? {}, 'farm_code') !== '-' ? pickString(farm ?? {}, 'farm_code') : null,
              )}
            </Text>
            {mixings.map((record) => {
              const id = Number(record.id ?? record.mixing_id ?? record.mixing_record_id);
              return (
                <Pressable key={String(id)} style={styles.card} onPress={() => selectMixing(record)}>
                  <Text style={styles.cardTitle}>
                    {pickString(record, 'mixing_code', 'mixing_record_id', 'id')}
                  </Text>
                  <Text style={styles.text}>
                    {pickString(record, 'status')} ·{' '}
                    {pickString(record, 'date_of_mixing', 'mixing_date')}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.card} onPress={() => selectMixing(null)}>
              <Text style={styles.cardTitle}>Continue without mixing filter</Text>
              <Text style={styles.text}>Use all eligible batches for this farm</Text>
            </Pressable>
            {!loading && mixings.length === 0 ? (
              <Text style={styles.text}>No mixing records found — you can continue without a filter.</Text>
            ) : null}
          </>
        ) : null}

        {step === 'submit' ? (
          <>
            <Pressable onPress={() => setStep('mixing')}>
              <Text style={styles.backLink}>← Back to mixing</Text>
            </Pressable>
            <Text style={styles.text}>
              Selected: {formatFarmerDisplayId(farmer)} ·{' '}
              {formatFarmDisplayCode(
                Number(farm?.id ?? 0),
                pickString(farm ?? {}, 'farm_code') !== '-' ? pickString(farm ?? {}, 'farm_code') : null,
              )}
              {mixingId ? ` · Mixing #${mixingId}` : ''}
            </Text>
            {batches.map((batch) => {
              const batchId = Number(batch.batch_id ?? batch.id);
              return (
                <View key={batchId} style={styles.card}>
                  <Text style={styles.cardTitle}>{pickString(batch, 'batch_code')}</Text>
                  <Text style={styles.text}>
                    Available: {String(batch.available_quantity ?? 0)} {String(batch.unit ?? 'kg')}
                  </Text>
                  <TextInput
                    value={quantities[batchId] ?? ''}
                    onChangeText={(value) =>
                      setQuantities((current) => ({ ...current, [batchId]: value }))
                    }
                    placeholder="Quantity applied"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
              );
            })}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              multiline
              style={[styles.input, styles.notes]}
            />
            <View style={styles.row}>
              <AppButton label="Add Photo" variant="secondary" onPress={() => void addEvidence('photo')} />
              <AppButton label="Add Video" variant="secondary" onPress={() => void addEvidence('video')} />
            </View>
            {evidences.map((evidence) => (
              <Text key={`${evidence.uri}-${evidence.name}`} style={styles.text}>
                {evidence.evidenceType}: {evidence.name}
              </Text>
            ))}
            <AppButton
              label={loading ? 'Submitting…' : 'Submit'}
              disabled={loading}
              onPress={() => void submit()}
            />
            <AppButton label="Add New (Farmer list)" variant="secondary" onPress={resetToFarmers} />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? <Text style={styles.text}>Loading…</Text> : null}
      </KeyboardSafeScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { gap: 12, padding: 16, paddingBottom: 36 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  text: { color: colors.textMuted },
  stepHint: { color: colors.text, fontWeight: '700', fontSize: 16 },
  backLink: { color: colors.primary, fontWeight: '700', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 44,
    padding: 10,
  },
  notes: { minHeight: 96, textAlignVertical: 'top' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  cardTitle: { color: colors.text, fontWeight: '700' },
  error: { color: colors.error },
});
