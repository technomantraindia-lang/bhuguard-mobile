import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerHeroSummaryCardProps {
  farmerCode: string;
  fullName: string;
  locationLabel: string;
  projectName: string;
  totalLandLabel: string;
  isVerified: boolean;
  onPress: () => void;
  onProfilePress: () => void;
  onLocationPress: () => void;
  onProjectPress: () => void;
  onTotalLandPress: () => void;
}

export function FarmerHeroSummaryCard({
  farmerCode,
  fullName,
  locationLabel,
  projectName,
  totalLandLabel,
  isVerified,
  onPress,
  onProfilePress,
  onLocationPress,
  onProjectPress,
  onTotalLandPress,
}: FarmerHeroSummaryCardProps) {
  return (
    <DashboardPressable onPress={onPress} style={[styles.card, dashboardShadow]}>
      <View style={styles.topBar}>
        <DashboardPressable variant="button" onPress={onProfilePress} style={styles.codeRow}>
          <BhuguardMaterialIcon name="badge" size={18} color={dashboardTheme.primaryContainer} />
          <Text style={styles.codeText}>{farmerCode}</Text>
        </DashboardPressable>

        {isVerified ? (
          <View style={styles.verifiedBadge}>
            <BhuguardMaterialIcon name="verified" size={14} color={dashboardTheme.primaryContainer} filled />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <DashboardPressable variant="button" onPress={onProfilePress}>
          <Text style={styles.name}>{fullName}</Text>
        </DashboardPressable>

        <View style={styles.grid}>
          <DashboardPressable variant="button" onPress={onLocationPress} style={styles.gridItem}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{locationLabel}</Text>
          </DashboardPressable>
          <DashboardPressable variant="button" onPress={onProjectPress} style={styles.gridItem}>
            <Text style={styles.label}>Project</Text>
            <Text style={styles.value}>{projectName}</Text>
          </DashboardPressable>
          <DashboardPressable variant="button" onPress={onTotalLandPress} style={styles.gridItem}>
            <Text style={styles.label}>Total Land</Text>
            <Text style={[styles.value, styles.landValue]}>{totalLandLabel}</Text>
          </DashboardPressable>
        </View>
      </View>
    </DashboardPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: dashboardTheme.surfaceLow,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurfaceVariant,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  body: {
    padding: 24,
    gap: 12,
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '47%',
    gap: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
  },
  landValue: {
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
});
