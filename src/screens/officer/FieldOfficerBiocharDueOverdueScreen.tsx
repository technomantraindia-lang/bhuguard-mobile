import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getApiErrorMessage } from '../../api/authApi';
import { getFieldOfficerFarmActivityDues } from '../../api/fieldOfficerApi';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerBiocharDueOverdue'>;

type FilterValue = 'due' | 'overdue' | 'all';

function formatDate(value: unknown): string {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapItemStatus(status: string): 'due' | 'overdue' | 'other' {
  if (status === 'overdue') {
    return 'overdue';
  }
  if (status === 'due_today' || status === 'due_soon' || status === 'due') {
    return 'due';
  }
  return 'other';
}

export function FieldOfficerBiocharDueOverdueScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const [filter, setFilter] = useState<FilterValue>(route.params?.initialFilter ?? 'all');
  const [counts, setCounts] = useState({ due: 0, overdue: 0 });
  const [items, setItems] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getFieldOfficerFarmActivityDues('all');
      const due =
        Number(data?.counts?.due_today ?? 0) + Number(data?.counts?.due_soon ?? 0);
      setCounts({
        due,
        overdue: Number(data?.counts?.overdue ?? 0),
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load Farm Activity dues.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const filteredItems = items.filter((item) => {
    if (filter === 'all') {
      return true;
    }

    return mapItemStatus(pickString(item, 'status')) === filter;
  });

  const openFarmActivity = (item: ApiRecord) => {
    const farmerId = Number(item.farmer_id);
    const farmId = Number(item.farm_id);
    if (!Number.isFinite(farmerId) || farmerId <= 0) {
      return;
    }

    const resolvedFarmId = Number.isFinite(farmId) && farmId > 0 ? farmId : undefined;
    const isOverdue = mapItemStatus(pickString(item, 'status')) === 'overdue';

    navigation.navigate('FieldOfficerFarmActivityStart', {
      farmerId,
      farmId: resolvedFarmId,
      farmerCode: pickString(item, 'farmer_code') !== '-' ? pickString(item, 'farmer_code') : undefined,
      farmerName: pickString(item, 'farmer_name') !== '-' ? pickString(item, 'farmer_name') : undefined,
      farmCode: pickString(item, 'farm_code') !== '-' ? pickString(item, 'farm_code') : undefined,
      lockFarmSelection: resolvedFarmId != null,
      overdue: isOverdue,
    });
  };

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader title="Farm Activity Due / Overdue" />

      {loading && items.length === 0 ? (
        <OfficerListState kind="loading" message="Loading Farm Activity dues…" />
      ) : error && items.length === 0 ? (
        <OfficerListState kind="error" message={error} onRetry={() => void load(false)} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={officerTheme.primary} />
          }
        >
          <View style={styles.summaryRow}>
            <SummaryCard
              label="Due"
              value={counts.due}
              tone="warning"
              active={filter === 'due'}
              onPress={() => setFilter((current) => (current === 'due' ? 'all' : 'due'))}
            />
            <SummaryCard
              label="Overdue"
              value={counts.overdue}
              tone="danger"
              active={filter === 'overdue'}
              onPress={() => setFilter((current) => (current === 'overdue' ? 'all' : 'overdue'))}
            />
          </View>

          {filter !== 'all' ? (
            <Pressable style={styles.clearFilterButton} onPress={() => setFilter('all')}>
              <Text style={styles.clearFilterText}>Show all ({items.length})</Text>
            </Pressable>
          ) : null}

          {filteredItems.length === 0 ? (
            <OfficerListState
              kind="empty"
              title="Nothing due right now"
              message="Farms with Farm Activity due or overdue will appear here."
            />
          ) : (
            filteredItems.map((item, index) => {
              const farmerId = Number(item.farmer_id);
              const isOverdue = mapItemStatus(pickString(item, 'status')) === 'overdue';
              const village = pickString(item, 'village');
              const farmCode = pickString(item, 'farm_code');
              const cycle = item.cycle_number != null ? `Cycle ${item.cycle_number}` : null;

              return (
                <Pressable
                  key={`${item.farm_id ?? index}-${item.activity_id ?? index}`}
                  style={[styles.card, officerCardShadow, isOverdue && styles.cardOverdue]}
                  onPress={() => (farmerId ? openFarmActivity(item) : undefined)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.farmerName}>{pickString(item, 'farmer_name')}</Text>
                    <View style={styles.statusChip}>
                      <Text style={[styles.statusText, isOverdue && styles.statusOverdue]}>
                        {pickString(item, 'status_label', 'status')}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.meta}>
                    {[farmCode !== '-' ? `Farm ${farmCode}` : null, village !== '-' ? village : null, cycle]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <Text style={styles.due}>Due: {formatDate(item.due_at ?? item.next_due_at)}</Text>
                  <Text style={styles.cta}>
                    {isOverdue ? 'Complete Overdue Farm Activity' : 'Start Farm Activity'}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </OfficerScreenChrome>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  active,
  onPress,
}: {
  label: string;
  value: number;
  tone: 'warning' | 'danger';
  active: boolean;
  onPress: () => void;
}) {
  const toneStyles =
    tone === 'danger'
      ? { bg: '#FEF2F2', border: officerTheme.error, value: '#B91C1C' }
      : { bg: '#FFFBEB', border: '#CA8A04', value: '#A16207' };

  return (
    <Pressable
      style={[
        styles.summaryCard,
        officerCardShadow,
        { backgroundColor: toneStyles.bg, borderColor: active ? toneStyles.border : officerTheme.outlineVariant },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.summaryValue, { color: toneStyles.value }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  clearFilterButton: { alignSelf: 'flex-start' },
  clearFilterText: { color: officerTheme.primary, fontWeight: '700' },
  card: {
    backgroundColor: officerTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 14,
    gap: 6,
  },
  cardOverdue: { borderColor: officerTheme.error },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  farmerName: { flex: 1, fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  statusChip: {
    backgroundColor: officerTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: officerTheme.onSecondaryContainer, textTransform: 'capitalize' },
  statusOverdue: { color: '#B91C1C' },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  due: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurface },
  cta: { marginTop: 4, fontSize: 13, fontWeight: '700', color: officerTheme.primary },
});
