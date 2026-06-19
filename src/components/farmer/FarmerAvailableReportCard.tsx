import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportItem, ReportStatusBadge } from '../../utils/farmerReportHelpers';

interface FarmerAvailableReportCardProps {
  report: FarmerReportItem;
  onView: () => void;
}

function statusStyles(status: ReportStatusBadge) {
  switch (status) {
    case 'verified':
      return { backgroundColor: dashboardTheme.primaryContainer, color: dashboardTheme.onPrimary };
    case 'updated':
      return { backgroundColor: `${dashboardTheme.tertiaryContainer}4D`, color: dashboardTheme.onSurface };
    case 'pending':
      return { backgroundColor: dashboardTheme.surfaceVariant, color: dashboardTheme.onSurfaceVariant };
    default:
      return { backgroundColor: dashboardTheme.secondaryContainer, color: dashboardTheme.onSecondaryContainer };
  }
}

function statusLabel(status: ReportStatusBadge): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'updated':
      return 'Updated';
    case 'pending':
      return 'Pending Review';
    default:
      return 'Available';
  }
}

export function FarmerAvailableReportCard({ report, onView }: FarmerAvailableReportCardProps) {
  const badge = statusStyles(report.statusBadge);
  const iconBackground =
    report.iconTone === 'verified' ? dashboardTheme.surfaceLow : dashboardTheme.surfaceContainerLow;
  const iconColor = report.iconTone === 'verified' ? dashboardTheme.primaryContainer : dashboardTheme.primary;

  return (
    <Pressable style={({ pressed }) => [styles.card, dashboardShadow, pressed && styles.pressed]} onPress={onView}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <BhuguardMaterialIcon name={report.icon} size={24} color={iconColor} filled />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {report.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {report.description}
          </Text>
          <Text style={styles.updated}>{report.updatedLabel}</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{statusLabel(report.statusBadge)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Text style={styles.actionText}>View Report</Text>
        <BhuguardMaterialIcon name="chevron_right" size={18} color={dashboardTheme.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}33`,
    padding: 12,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.onSurfaceVariant,
    marginTop: 2,
  },
  updated: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    marginTop: 2,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
    maxWidth: 88,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: `${dashboardTheme.outlineVariant}33`,
    paddingTop: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
