import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFarmerBaselineAssessments } from '../../api/farmerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { formatActivityDisplayDate } from '../../utils/activityDateHelpers';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { getApiErrorMessage } from '../../api/authApi';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

interface BaselineListItem {
  id: number;
  farmName: string;
  dateLabel: string;
  statusLabel: string;
  socLabel: string;
}

function mapItem(record: ApiRecord): BaselineListItem | null {
  const id = Number(record.id);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const soc = pickString(record, 'soil_organic_carbon');

  return {
    id,
    farmName: pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : 'Farm',
    dateLabel:
      pickString(record, 'assessment_date') !== '-'
        ? formatActivityDisplayDate(pickString(record, 'assessment_date').slice(0, 10))
        : '—',
    statusLabel: pickString(record, 'status') !== '-' ? pickString(record, 'status') : 'submitted',
    socLabel: soc !== '-' ? `${soc}% SOC` : 'Before project baseline',
  };
}

export function FarmerBaselineAssessmentsScreen() {
  const navigation = useNavigation<Nav>();
  const [items, setItems] = useState<BaselineListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFarmerBaselineAssessments();
      const mapped = extractList(data as ApiRecord, ['baseline_assessments', 'assessments'])
        .map(mapItem)
        .filter((item): item is BaselineListItem => item !== null);

      setItems(mapped);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load baseline assessments.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading && items.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading baseline assessments..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title="Baseline Assessments"
          subtitle="Regenerative Agriculture • Before Project"
        />
        <Pressable
          style={[styles.addButton, dashboardShadow]}
          onPress={() => navigation.navigate('FarmerAddBaselineAssessment')}
        >
          <BhuguardMaterialIcon name="add_circle" size={18} color={dashboardTheme.onPrimary} />
          <Text style={styles.addButtonText}>Add Baseline</Text>
        </Pressable>
      </View>

      {error && items.length === 0 ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No baseline yet</Text>
              <Text style={styles.emptyCopy}>
                Add your before-project soil, yield, fertilizer and water data to start weekly MRV tracking.
              </Text>
              <Pressable style={styles.emptyButton} onPress={() => navigation.navigate('FarmerAddBaselineAssessment')}>
                <Text style={styles.emptyButtonText}>Add Baseline Assessment</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, dashboardShadow]}
              onPress={() => navigation.navigate('FarmerBaselineAssessmentDetail', { assessmentId: item.id })}
            >
              <View style={styles.cardHeader}>
                <BhuguardMaterialIcon name="science" size={20} color={dashboardTheme.primaryContainer} />
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>{item.farmName}</Text>
                  <Text style={styles.cardMeta}>{item.dateLabel} • {item.socLabel}</Text>
                </View>
                <Text style={styles.status}>{item.statusLabel}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  headerWrap: { paddingHorizontal: dashboardTheme.marginMobile, gap: 10 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 8,
  },
  addButtonText: { color: dashboardTheme.onPrimary, fontWeight: '700', fontSize: 14 },
  list: { padding: dashboardTheme.marginMobile, gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCopy: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: dashboardTheme.onSurface },
  cardMeta: { fontSize: 12, color: dashboardTheme.onSurfaceVariant },
  status: { fontSize: 11, fontWeight: '700', color: dashboardTheme.primaryContainer, textTransform: 'capitalize' },
  empty: { padding: 24, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  emptyCopy: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: dashboardTheme.onSurfaceVariant },
  emptyButton: {
    marginTop: 8,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyButtonText: { color: dashboardTheme.onPrimary, fontWeight: '700' },
});
