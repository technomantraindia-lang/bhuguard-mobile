import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFarmerBiocharActivities } from '../../api/farmerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FarmerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

function statusTone(status: string): string {
  if (status === 'draft' || status === 'correction_required') {
    return '#CA8A04';
  }

  if (status === 'submitted_for_review') {
    return colors.primary;
  }

  return colors.textMuted;
}

export function FarmerBiocharActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const [drafts, setDrafts] = useState<ApiRecord[]>([]);
  const [submitted, setSubmitted] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [draftData, submittedData] = await Promise.all([
        getFarmerBiocharActivities({ status: 'draft' }),
        getFarmerBiocharActivities({ status: 'submitted' }),
      ]);
      setDrafts(extractList(draftData as ApiRecord, ['batches', 'activities']));
      setSubmitted(extractList(submittedData as ApiRecord, ['batches', 'activities']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load Biochar activities.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && drafts.length === 0 && submitted.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading Biochar activities..." />
      </SafeAreaView>
    );
  }

  if (error && drafts.length === 0 && submitted.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  const renderRecord = (record: ApiRecord) => {
    const id = Number(record.id);
    const batchCode = pickString(record, 'batch_code', 'batchCode');
    const farmerName = pickString(record, 'farmer_name', 'farmerName');
    const status = pickString(record, 'status');
    const statusLabel = pickString(record, 'status_label', 'statusLabel');
    const canEdit = record.can_edit === true;

    return (
      <Pressable
        key={String(id)}
        style={[styles.card, canEdit && styles.cardDraft]}
        onPress={() => navigation.navigate('FarmerBiocharProduction', { batchId: id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{pickString(record, 'production_record_code', 'productionRecordCode')}</Text>
          <Text style={[styles.statusBadge, { color: statusTone(status) }]}>{statusLabel !== '-' ? statusLabel : status}</Text>
        </View>
        <Text style={styles.meta}>Project: Biochar · {pickString(record, 'production_date_label', 'productionDateLabel')}</Text>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Batch ID</Text>
          <Text style={styles.fieldValue}>{batchCode !== '-' ? batchCode : `Record #${id}`}</Text>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Farmer Name</Text>
          <Text style={styles.fieldValue}>{farmerName !== '-' ? farmerName : '—'}</Text>
        </View>
        <Text style={styles.action}>{canEdit ? 'Tap to continue draft' : 'Tap to view record'}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Biochar Activity" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        <Pressable style={styles.newButton} onPress={() => navigation.navigate('FarmerBiocharProduction', {})}>
          <Text style={styles.newButtonText}>New Biochar Activity</Text>
        </Pressable>
        <Pressable style={styles.mixingButton} onPress={() => navigation.navigate('FarmerBiocharMixing', {})}>
          <Text style={styles.mixingButtonText}>Add Biochar Mixing</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Draft Activities ({drafts.length})</Text>
        {drafts.length === 0 ? <Text style={styles.empty}>No draft activities yet.</Text> : drafts.map(renderRecord)}

        <Text style={styles.sectionTitle}>Submitted Activities ({submitted.length})</Text>
        {submitted.length === 0 ? <Text style={styles.empty}>No submitted activities yet.</Text> : submitted.map(renderRecord)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  newButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  mixingButton: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  mixingButtonText: { color: colors.primaryDark, fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 },
  empty: { color: colors.textMuted, fontSize: 14 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardDraft: { borderColor: '#CA8A04', backgroundColor: '#FFFBEB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  statusBadge: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  meta: { fontSize: 13, color: colors.textMuted },
  fieldBlock: { marginTop: 4, gap: 2 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: colors.text },
  action: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 8 },
});
