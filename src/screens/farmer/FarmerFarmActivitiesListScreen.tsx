import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFarmerFarmActivityHistory } from '../../api/farmerApi';
import { EmptyState } from '../../components/EmptyState';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatLocalizedDate } from '../../utils/localizedDate';
import { useTranslation } from '../../i18n/I18nContext';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmActivitiesList'>;

const PAGE_SIZE = 20;

function roleLabel(role: string): string {
  const normalized = role.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized.includes('field officer') || normalized === 'fo' || normalized === 'fieldofficer') {
    return 'Field Officer';
  }
  if (normalized.includes('artisan pro')) {
    return 'Artisan Pro';
  }
  if (normalized.includes('artisan')) {
    return 'Artisan';
  }
  if (normalized.includes('admin')) {
    return 'Admin';
  }
  if (normalized.includes('farmer') || normalized === 'legacy') {
    return 'Farmer';
  }
  return role || 'Farmer';
}

function mapHistoryRecord(record: ApiRecord, farmId: number): ApiRecord {
  const source = pickString(record, 'source');
  const performedByRole =
    pickString(record, 'performed_by_role', 'created_by_role') !== '-'
      ? pickString(record, 'performed_by_role', 'created_by_role')
      : source === 'farm_verification_activities'
        ? 'field_officer'
        : 'farmer';

  const performedByName =
    pickString(record, 'performed_by_name', 'field_officer_name', 'farmer_name') !== '-'
      ? pickString(record, 'performed_by_name', 'field_officer_name', 'farmer_name')
      : '—';

  return {
    ...record,
    farm_id: Number(record.farm_id ?? farmId),
    performed_by_role: performedByRole,
    performed_by_name: performedByName,
  };
}

export function FarmerFarmActivitiesListScreen({ navigation, route }: Props) {
  const { farmId, farmName } = route.params;
  const { language } = useTranslation();
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getFarmerFarmActivityHistory(farmId);
      const history = Array.isArray((data as ApiRecord).history)
        ? ((data as ApiRecord).history as ApiRecord[])
        : [];
      setRecords(history.map((item) => mapHistoryRecord(item, farmId)));
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farm activities.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [farmId]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const visibleRecords = records.slice(0, visibleCount);

  const renderItem = ({ item }: { item: ApiRecord }) => {
    const activityId =
      pickString(item, 'activity_code', 'activity_id', 'source_id') !== '-'
        ? pickString(item, 'activity_code', 'activity_id', 'source_id')
        : '—';
    const activityType =
      pickString(item, 'activity_type', 'display_status') !== '-'
        ? pickString(item, 'activity_type', 'display_status')
        : 'Farm Activity';
    const status =
      pickString(item, 'display_status', 'status') !== '-'
        ? pickString(item, 'display_status', 'status')
        : '—';
    const when =
      pickString(item, 'completed_at', 'started_at', 'activity_date') !== '-'
        ? pickString(item, 'completed_at', 'started_at', 'activity_date')
        : '';
    const evidenceCount = Number(item.evidence_count ?? (item.has_evidence ? 1 : 0));
    const syncStatus =
      pickString(item, 'sync_status', 'status') !== '-'
        ? pickString(item, 'sync_status', 'status')
        : 'submitted';

    return (
      <View style={styles.card} accessibilityRole="text">
        <Text style={styles.title}>{activityType}</Text>
        <Text style={styles.meta}>Activity ID: {activityId}</Text>
        <Text style={styles.meta}>Date: {formatLocalizedDate(when, language)}</Text>
        <Text style={styles.meta}>Status: {status}</Text>
        <Text style={styles.meta}>Performed by: {String(item.performed_by_name ?? '—')}</Text>
        <Text style={styles.meta}>Role: {roleLabel(String(item.performed_by_role ?? 'farmer'))}</Text>
        <Text style={styles.meta}>Farm ID: {String(item.farm_id ?? farmId)}</Text>
        <Text style={styles.meta}>Evidence: {Number.isFinite(evidenceCount) ? evidenceCount : 0}</Text>
        <Text style={styles.meta}>Sync: {syncStatus}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Farm Activities</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {farmName || `Farm #${farmId}`}
          </Text>
        </View>
      </View>

      {loading && records.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={dashboardTheme.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleRecords}
          keyExtractor={(item, index) =>
            `${pickString(item, 'source')}-${pickString(item, 'source_id', 'activity_id')}-${index}`
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={dashboardTheme.primary} />
          }
          ListHeaderComponent={
            error ? <Text style={styles.errorText}>{error}</Text> : null
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              title="No activities"
              message="No activities have been recorded for this Farm yet."
            />
          }
          ListFooterComponent={
            visibleCount < records.length ? (
              <Pressable style={styles.loadMore} onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                <Text style={styles.loadMoreText}>Load more</Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surface,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  headerCopy: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  headerSubtitle: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 4,
  },
  title: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onSurface, marginBottom: 2 },
  meta: { fontSize: 13, color: dashboardTheme.textMuted, lineHeight: 18 },
  errorText: { color: dashboardTheme.error, marginBottom: 8 },
  loadMore: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
