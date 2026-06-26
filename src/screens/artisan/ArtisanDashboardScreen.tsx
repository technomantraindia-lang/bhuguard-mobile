import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getArtisanDashboard } from '../../api/artisanApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanDashboard'>;

function MenuCard({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export function ArtisanDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const [dashboard, setDashboard] = useState<ApiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getArtisanDashboard();
      setDashboard((data.dashboard ?? data) as ApiRecord);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load artisan dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading artisan dashboard..." />
      </SafeAreaView>
    );
  }

  if (error && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  const artisanName = pickString(dashboard ?? {}, 'artisan_name', 'artisanName');
  const draftCount = Number(dashboard?.draft_production_count ?? 0);
  const submittedCount = Number(dashboard?.submitted_production_count ?? 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Artisan Dashboard"
        showBrandLogo={false}
        rightAction={{ label: 'Profile', onPress: () => navigation.navigate('ArtisanProfile') }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcome}>Welcome, {artisanName !== '-' ? artisanName : 'Artisan'}</Text>
        <Text style={styles.hint}>Biochar production only — no farmer, officer, or admin tools.</Text>

        <MenuCard
          title="Enter Farm ID"
          subtitle="Look up a farm and start feedstock check"
          onPress={() => navigation.navigate('ArtisanFarmLookup')}
        />
        <MenuCard
          title="Biochar Production"
          subtitle="Enter Farm ID, capture feedstock, and record production"
          onPress={() => navigation.navigate('ArtisanFarmLookup')}
        />
        <MenuCard
          title="Draft Production Records"
          subtitle={`${draftCount} draft record${draftCount === 1 ? '' : 's'}`}
          onPress={() => navigation.navigate('ArtisanProductionRecords', { status: 'draft' })}
        />
        <MenuCard
          title="Submitted Production Records"
          subtitle={`${submittedCount} submitted record${submittedCount === 1 ? '' : 's'}`}
          onPress={() => navigation.navigate('ArtisanProductionRecords', { status: 'submitted' })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md },
  welcome: { fontSize: 22, fontWeight: '700', color: colors.text },
  hint: { color: colors.textMuted, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cardSubtitle: { color: colors.textMuted },
});
