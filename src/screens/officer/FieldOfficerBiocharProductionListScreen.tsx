import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getApiErrorMessage } from '../../api/authApi';
import { getFieldOfficerBiocharBatches } from '../../api/fieldOfficerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatStatusLabel } from '../../utils/statusLabels';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerBiocharProductionList'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerBiocharProductionList'>;

function statusTone(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'draft' || normalized === 'correction_required') {
    return '#CA8A04';
  }

  if (normalized === 'submitted_for_review' || normalized === 'reviewed' || normalized === 'produced') {
    return officerTheme.primaryContainer;
  }

  if (normalized === 'completed' || normalized === 'approved') {
    return officerTheme.primary;
  }

  return officerTheme.onSurfaceVariant;
}

function displayValue(value: string | number | null | undefined): string {
  if (value == null) {
    return '—';
  }
  const text = String(value).trim();
  return !text || text === '-' ? '—' : text;
}

export function FieldOfficerBiocharProductionListScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const [batches, setBatches] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const context = route.params;
  const farmerId = context?.farmerId != null ? Number(context.farmerId) : undefined;
  const farmId = context?.farmId != null ? Number(context.farmId) : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFieldOfficerBiocharBatches({
        farmer_id: farmerId,
        farm_id: farmId,
      });
      const list = extractList(data as ApiRecord, ['batches']).sort((left, right) => {
        const leftId = Number(left.id ?? 0);
        const rightId = Number(right.id ?? 0);
        return rightId - leftId;
      });
      setBatches(list);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load Biochar production batches.'));
    } finally {
      setLoading(false);
    }
  }, [farmId, farmerId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const subtitle = useMemo(() => {
    if (context?.farmName && context.farmName !== '-') {
      return `${context.farmerName ?? 'Farmer'} · ${context.farmName}`;
    }
    if (context?.farmerName && context.farmerName !== '-') {
      return context.farmerName;
    }
    return 'Draft, in-progress, and completed batches';
  }, [context?.farmName, context?.farmerName]);

  const openCreateBatch = () => {
    navigation.navigate('FieldOfficerBiocharProduction', {
      farmerId,
      farmerCode: context?.farmerCode,
      farmerName: context?.farmerName,
      farmId,
      farmCode: context?.farmCode,
      farmName: context?.farmName,
      village: context?.village,
      taluka: context?.taluka,
      district: context?.district,
      state: context?.state,
    });
  };

  if (loading && batches.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading Biochar production batches..." />
      </SafeAreaView>
    );
  }

  if (error && batches.length === 0) {
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
    const farmName = pickString(record, 'farm_name', 'farmName');
    const status = pickString(record, 'status');
    const statusLabel =
      pickString(record, 'status_label', 'statusLabel') !== '-'
        ? pickString(record, 'status_label', 'statusLabel')
        : formatStatusLabel(status);
    const canEdit = record.can_edit === true;
    const productionQty = record.biochar_output != null
      ? `${record.biochar_output} ${pickString(record, 'biochar_output_unit') !== '-' ? pickString(record, 'biochar_output_unit') : 'kg'}`
      : '—';
    const availableStock =
      record.available_stock_kg != null || record.current_available_stock != null
        ? `${record.available_stock_kg ?? record.current_available_stock} kg`
        : '—';

    return (
      <Pressable
        key={String(id)}
        style={[styles.card, canEdit && styles.cardDraft]}
        onPress={() =>
          navigation.navigate('FieldOfficerBiocharProduction', {
            batchId: id,
            farmerId: record.farmer_id != null ? Number(record.farmer_id) : farmerId,
            farmerCode: pickString(record, 'farmer_code') !== '-' ? pickString(record, 'farmer_code') : context?.farmerCode,
            farmerName: farmerName !== '-' ? farmerName : context?.farmerName,
            farmId: record.farm_id != null ? Number(record.farm_id) : farmId,
            farmCode: pickString(record, 'farm_code') !== '-' ? pickString(record, 'farm_code') : context?.farmCode,
            farmName: farmName !== '-' ? farmName : context?.farmName,
            village: context?.village,
            taluka: context?.taluka,
            district: context?.district,
            state: context?.state,
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{displayValue(batchCode !== '-' ? batchCode : `Batch #${id}`)}</Text>
          <Text style={[styles.statusBadge, { color: statusTone(status) }]}>{statusLabel}</Text>
        </View>

        <Text style={styles.meta}>
          Farmer: {displayValue(farmerName)} ({displayValue(record.farmer_id ?? record.farmer_code)})
        </Text>
        <Text style={styles.meta}>
          Farm: {displayValue(farmName)} ({displayValue(record.farm_id ?? record.farm_code)})
        </Text>
        <Text style={styles.meta}>Production date: {displayValue(pickString(record, 'production_date_label', 'production_date'))}</Text>
        <Text style={styles.meta}>Feedstock: {displayValue(pickString(record, 'feedstock_type'))}</Text>
        <Text style={styles.meta}>Production quantity: {productionQty}</Text>
        <Text style={styles.meta}>Available stock: {availableStock}</Text>
        <Text style={styles.meta}>
          Mixing: {displayValue(pickString(record, 'mixing_status_label', 'mixing_status'))}
        </Text>
        <Text style={styles.meta}>
          Inventory: {displayValue(pickString(record, 'inventory_status_label', 'inventory_status'))}
        </Text>
        <Text style={styles.meta}>
          Created by: {displayValue(pickString(record, 'created_by_role', 'source_label'))} ·{' '}
          {displayValue(pickString(record, 'created_by_user_name', 'officer_name'))}
        </Text>
        {status === 'completed' && pickString(record, 'completed_date', 'completed_at', 'approved_at') !== '-' ? (
          <Text style={styles.meta}>Completed: {displayValue(pickString(record, 'completed_date', 'completed_at', 'approved_at'))}</Text>
        ) : null}
        <Text style={styles.action}>{canEdit ? 'Tap to continue draft' : 'Tap to view batch'}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Biochar Production Batches" subtitle={subtitle} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={officerTheme.primary} />}
      >
        <Pressable style={styles.newButton} onPress={openCreateBatch}>
          <Text style={styles.newButtonText}>Add Biochar Production Batch</Text>
        </Pressable>

        {farmId || farmerId ? (
          <Text style={styles.scopeHint}>
            Showing batches for {farmerId ? `Farmer #${farmerId}` : 'selected farmer'}
            {farmId ? ` · Farm #${farmId}` : ''}
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>All Batches ({batches.length})</Text>
        {batches.length === 0 ? (
          <Text style={styles.empty}>
            {farmId
              ? 'No Biochar production batches found for this farm.'
              : 'No Biochar production batches found.'}
          </Text>
        ) : (
          batches.map(renderRecord)
        )}
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
  scopeHint: { color: officerTheme.onSurfaceVariant, fontSize: 13 },
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
  statusBadge: { fontSize: 12, fontWeight: '700' },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  action: { fontSize: 12, fontWeight: '600', color: officerTheme.primaryContainer, marginTop: 8 },
});
