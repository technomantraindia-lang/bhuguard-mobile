import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getSupportThreads } from '../../api/supportApi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SupportHeroBanner } from '../../components/support/SupportHeroBanner';
import { SupportThreadCard } from '../../components/support/SupportThreadCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import type { SupportRole } from '../../constants/supportCategories';
import { useSupportAutoRefresh } from '../../hooks/useSupportAutoRefresh';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { extractList, type ApiRecord } from '../../utils/apiHelpers';

interface SupportThreadsScreenProps {
  supportRole: SupportRole;
}

export function SupportThreadsScreen({ supportRole }: SupportThreadsScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<ApiRecord[]>([]);
  const hasThreadsRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(false);
    } else if (!hasThreadsRef.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    if (!silent) {
      setError(null);
    }

    try {
      const data = await getSupportThreads();
      const nextThreads = extractList(data, ['threads']);
      hasThreadsRef.current = nextThreads.length > 0;
      setThreads(nextThreads);
    } catch (err) {
      if (!silent) {
        setError(getApiErrorMessage(err, 'Failed to load support threads.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useSupportAutoRefresh(load, { intervalMs: 10000 });

  if (loading && threads.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Help & Support" />
        <LoadingState message="Loading support threads..." />
      </SafeAreaView>
    );
  }

  if (error && threads.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Help & Support" />
        <ErrorState message={error} onRetry={() => void load(false)} />
      </SafeAreaView>
    );
  }

  const openCount = threads.filter((thread) => String(thread.status) === 'open' || String(thread.status) === 'pending').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Help & Support"
        subtitle="Live inbox · updates automatically"
        rightAction={{ label: 'New', onPress: () => navigation.navigate('CreateSupportThread', { supportRole }) }}
      />

      <FlatList
        data={threads}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(false)} tintColor={dashboardTheme.primary} />}
        ListHeaderComponent={
          <>
            <SupportHeroBanner
              title="We're here to help"
              subtitle="Messages and queries refresh automatically while this screen is open."
            />
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{threads.length}</Text>
                <Text style={styles.summaryLabel}>Total Queries</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{openCount}</Text>
                <Text style={styles.summaryLabel}>Active</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            title="No support queries yet"
            message="Create your first query and our team will respond in this inbox."
          />
        }
        renderItem={({ item }) => (
          <SupportThreadCard
            thread={item}
            onPress={() => navigation.navigate('SupportChat', { threadId: Number(item.id) })}
          />
        )}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('CreateSupportThread', { supportRole })}
      >
        <BhuguardMaterialIcon name="add_circle" size={20} color="#fff" />
        <Text style={styles.fabText}>New Query</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  listContent: { gap: 12, padding: 16, paddingBottom: 110 },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderColor: 'rgba(191, 201, 190, 0.35)',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...dashboardShadow,
  },
  summaryValue: {
    color: dashboardTheme.headingGreen,
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    color: dashboardTheme.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: dashboardTheme.primary,
    borderRadius: 999,
    bottom: 24,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    left: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: 'absolute',
    right: 16,
    ...dashboardShadow,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorText: { color: dashboardTheme.error, fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 },
});
