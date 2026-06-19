import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useFarmerBaselineAssessmentDetail } from '../../hooks/useFarmerBaselineAssessmentDetail';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerBaselineAssessmentDetail'>;

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function FarmerBaselineAssessmentDetailScreen({ route }: Props) {
  const { assessmentId } = route.params;
  const { assessment, loading, error, reload } = useFarmerBaselineAssessmentDetail(assessmentId);

  if (loading && !assessment) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading baseline assessment..." />
      </SafeAreaView>
    );
  }

  if (error && !assessment) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const item = assessment!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        <ScreenHeader title="Baseline Assessment" subtitle="Before Project" />

        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <BhuguardMaterialIcon name="science" size={20} color={dashboardTheme.primaryContainer} />
            <Text style={styles.badge}>Regenerative Agriculture • Before Project</Text>
          </View>

          <DetailRow label="Farm" value={item.farmName} />
          <DetailRow label="Assessment Date" value={item.assessmentDateLabel} />
          <DetailRow label="Status" value={item.statusLabel} />
          <DetailRow label="Soil Organic Carbon" value={item.soilOrganicCarbonLabel} />
          <DetailRow label="Soil pH" value={item.soilPhLabel} />
          <DetailRow label="Yield" value={item.yieldLabel} />
          <DetailRow label="Fertilizer Use" value={item.fertilizerUse} />
          <DetailRow label="Water Use" value={item.waterUse} />
          <DetailRow label="Recorded At" value={item.recordedAtLabel} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 10,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer },
  row: { gap: 2 },
  label: { fontSize: 12, fontWeight: '600', color: dashboardTheme.textMuted },
  value: { fontSize: 15, fontWeight: '600', color: dashboardTheme.onSurface },
});
