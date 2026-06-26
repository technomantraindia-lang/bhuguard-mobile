import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerBenefitsSummaryCard } from '../../components/farmer/FarmerBenefitsSummaryCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerReportsData } from '../../hooks/useFarmerReportsData';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Nav = NativeStackNavigationProp<FarmerStackParamList>;

export function FarmerBenefitsScreen() {
  const navigation = useNavigation<Nav>();
  const { summary, loading, error, reload } = useFarmerReportsData();

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerPad}>
          <ScreenHeader title="Benefits" subtitle="Carbon credits and project incentives" showBack={false} />
        </View>
        <LoadingState message="Loading benefits..." />
      </SafeAreaView>
    );
  }

  if (error && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerPad}>
          <ScreenHeader title="Benefits" subtitle="Carbon credits and project incentives" />
        </View>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        <ScreenHeader title="Benefits" subtitle="Carbon credits and project incentives" />
        <FarmerBenefitsSummaryCard summary={summary!} onViewDetails={() => navigation.navigate('FarmerCarbonCalculations')} />
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>How benefits work</Text>
          <Text style={styles.noteText}>
            Approved activities and verified farms contribute to your eligible carbon credits and project incentives.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    gap: 16,
    paddingBottom: 32,
  },
  headerPad: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 12,
  },
  noteCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
});
