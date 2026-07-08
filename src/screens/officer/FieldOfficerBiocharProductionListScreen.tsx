import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFieldOfficerBiocharBatches } from '../../api/fieldOfficerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function statusTone(status: string): string {
  if (status === 'draft' || status === 'correction_required') {
    return '#CA8A04';
  }

  if (status === 'submitted_for_review') {
    return officerTheme.primaryContainer;
  }

  return officerTheme.onSurfaceVariant;
}

export function FieldOfficerBiocharProductionListScreen() {
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
        getFieldOfficerBiocharBatches({ status: 'draft' }),
        getFieldOfficerBiocharBatches({ status: 'submitted' }),
      ]);
      setDrafts(extractList(draftData as ApiRecord, ['batches']));
      setSubmitted(extractList(submittedData as ApiRecord, ['batches']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load biochar production records.'));
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
        <LoadingState message="Loading biochar production records..." />
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
        onPress={() =>
          navigation.navigate('FieldOfficerBiocharProduction', {
            batchId: id,
            farmerId: record.farmer_id != null ? Number(record.farmer_id) : undefined,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{pickString(record, 'production_record_code', 'productionRecordCode')}</Text>
          <Text style={[styles.statusBadge, { color: statusTone(status) }]}>{statusLabel !== '-' ? statusLabel : status}</Text>
        </View>
        <Text style={styles.meta}>Project: Biochar · {pickString(record, 'production_date_label', 'productionDateLabel')}</Text>
        {record.feedstock_quantity != null ? (
          <Text style={styles.meta}>Feedstock: {String(record.feedstock_quantity)} {pickString(record, 'feedstock_unit')}</Text>
        ) : null}
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={officerTheme.primary} />}
      >
        <Pressable
          style={styles.newButton}
          onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Farmers' })}
        >
          <Text style={styles.newButtonText}>New Production Record</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Draft Records ({drafts.length})</Text>
        {drafts.length === 0 ? <Text style={styles.empty}>No draft records yet.</Text> : drafts.map(renderRecord)}

        <Text style={styles.sectionTitle}>Submitted Records ({submitted.length})</Text>
        {submitted.length === 0 ? <Text style={styles.empty}>No submitted records yet.</Text> : submitted.map(renderRecord)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: { padding: officerTheme.marginMobile, gap: 12, paddingBottom: 40 },
  newButton: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  newButtonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface, marginTop: 8 },
  empty: { color: officerTheme.onSurfaceVariant, fontSize: 14 },
  card: {
    backgroundColor: officerTheme.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    gap: 4,
  },
  cardDraft: { borderColor: '#CA8A04', backgroundColor: '#FFFBEB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface, flex: 1 },
  statusBadge: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  fieldBlock: { marginTop: 4, gap: 2 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: officerTheme.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: officerTheme.onSurface },
  action: { fontSize: 12, fontWeight: '600', color: officerTheme.primaryContainer, marginTop: 8 },
});
