import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface CompanyQuickStatsGridProps {
  sitesCount: number;
  activeSubmissions: number;
  wasteRecordsCount: number;
  biocharRecordsCount: number;
  industrialCarbonRecordsCount: number;
  evidenceUploadsCount: number;
  pendingVerificationCount: number;
  finalReportsCount: number;
  onSitesPress: () => void;
  onSubmissionsPress: () => void;
  onWastePress: () => void;
  onBiocharPress: () => void;
  onIndustrialPress: () => void;
  onEvidencePress: () => void;
  onVerificationPress: () => void;
  onReportsPress: () => void;
}

function StatCard({
  icon,
  value,
  label,
  onPress,
}: {
  icon: BhuguardIconName;
  value: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <DashboardPressable onPress={onPress} style={[styles.card, dashboardShadow]}>
      <View style={styles.iconCircle}>
        <BhuguardMaterialIcon name={icon} size={20} color={dashboardTheme.primaryContainer} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </DashboardPressable>
  );
}

export function CompanyQuickStatsGrid({
  sitesCount,
  activeSubmissions,
  wasteRecordsCount,
  biocharRecordsCount,
  industrialCarbonRecordsCount,
  evidenceUploadsCount,
  pendingVerificationCount,
  finalReportsCount,
  onSitesPress,
  onSubmissionsPress,
  onWastePress,
  onBiocharPress,
  onIndustrialPress,
  onEvidencePress,
  onVerificationPress,
  onReportsPress,
}: CompanyQuickStatsGridProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <StatCard icon="location_on" value={String(sitesCount)} label="Sites" onPress={onSitesPress} />
        <StatCard icon="assignment" value={String(activeSubmissions)} label="Submissions" onPress={onSubmissionsPress} />
        <StatCard icon="description" value={String(wasteRecordsCount)} label="Waste Records" onPress={onWastePress} />
        <StatCard icon="science" value={String(biocharRecordsCount)} label="Biochar" onPress={onBiocharPress} />
      </View>
      <View style={styles.compactRow}>
        <StatCard
          icon="co2"
          value={String(industrialCarbonRecordsCount)}
          label="Industrial Carbon"
          onPress={onIndustrialPress}
        />
        <StatCard icon="photo_camera" value={String(evidenceUploadsCount)} label="Evidence" onPress={onEvidencePress} />
        <StatCard
          icon="pending_actions"
          value={String(pendingVerificationCount)}
          label="Pending Verification"
          onPress={onVerificationPress}
        />
        <StatCard icon="analytics" value={String(finalReportsCount)} label="Reports" onPress={onReportsPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  compactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    minHeight: 100,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 24, lineHeight: 32, fontWeight: '600', color: dashboardTheme.onSurface },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: dashboardTheme.textMuted },
});
