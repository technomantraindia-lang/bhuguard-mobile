import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportsSummary } from '../../utils/farmerReportHelpers';

interface FarmerDownloadsCenterCardProps {
  summary: FarmerReportsSummary;
  onDownloadAll: () => void;
}

export function FarmerDownloadsCenterCard({ summary, onDownloadAll }: FarmerDownloadsCenterCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.titleRow}>
        <BhuguardMaterialIcon name="upload" size={20} color={dashboardTheme.primary} />
        <Text style={styles.title}>Downloads Center</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValuePrimary}>{summary.totalReports}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValueSecondary}>{summary.downloadedCount}</Text>
          <Text style={styles.statLabel}>Downloaded</Text>
        </View>
        <View style={styles.statCardPending}>
          <Text style={styles.statValueTertiary}>{summary.pendingCount}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onDownloadAll}>
        <BhuguardMaterialIcon name="upload" size={18} color={dashboardTheme.onPrimary} />
        <Text style={styles.buttonText}>Download All Reports</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}4D`,
    padding: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: dashboardTheme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}1A`,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statCardPending: {
    flex: 1,
    backgroundColor: dashboardTheme.creditsSurface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${dashboardTheme.tertiaryContainer}33`,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  statValuePrimary: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  statValueSecondary: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.secondary,
  },
  statValueTertiary: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.tertiary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  button: {
    backgroundColor: dashboardTheme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onPrimary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
