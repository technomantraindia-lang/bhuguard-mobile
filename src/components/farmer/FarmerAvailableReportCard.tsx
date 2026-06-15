import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportItem, ReportStatusBadge } from '../../utils/farmerReportHelpers';

interface FarmerAvailableReportCardProps {
  report: FarmerReportItem;
  downloading?: boolean;
  onView: () => void;
  onDownload: () => void;
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

export function FarmerAvailableReportCard({
  report,
  downloading = false,
  onView,
  onDownload,
}: FarmerAvailableReportCardProps) {
  const badge = statusStyles(report.statusBadge);
  const iconBackground =
    report.iconTone === 'verified' ? dashboardTheme.surfaceLow : dashboardTheme.surfaceContainerLow;
  const iconColor = report.iconTone === 'verified' ? dashboardTheme.primaryContainer : dashboardTheme.primary;

  return (
    <View style={[styles.card, dashboardShadow]}>
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
        <Pressable style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]} onPress={onView}>
          <BhuguardMaterialIcon name="fact_check" size={18} color={dashboardTheme.primary} />
          <Text style={styles.actionText}>View</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed, downloading && styles.disabled]}
          onPress={onDownload}
          disabled={downloading}
        >
          <BhuguardMaterialIcon name="upload" size={18} color={dashboardTheme.primary} />
          <Text style={styles.actionText}>{downloading ? 'Downloading…' : 'Download PDF'}</Text>
        </Pressable>
      </View>
    </View>
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
    borderTopWidth: 1,
    borderTopColor: `${dashboardTheme.outlineVariant}33`,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.primary,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: `${dashboardTheme.outlineVariant}33`,
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
