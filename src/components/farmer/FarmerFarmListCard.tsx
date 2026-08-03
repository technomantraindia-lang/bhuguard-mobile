import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerFarmViewModel } from '../../utils/farmMapHelpers';

interface FarmerFarmListCardProps {
  farm: FarmerFarmViewModel;
  onViewDetails: () => void;
  onAddActivity: () => void;
  onMapBoundary: () => void;
  onViewBoundary: () => void;
  onOpenMap: () => void;
}

function StatusBadge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: 'verified' | 'pending' | 'draft' | 'mapped' | 'not_mapped';
  icon: 'verified' | 'schedule' | 'assignment' | 'map' | 'location_on';
}) {
  const toneStyles = {
    verified: { bg: dashboardTheme.surfaceLow, text: dashboardTheme.primaryContainer },
    pending: { bg: `${dashboardTheme.tertiaryContainer}33`, text: dashboardTheme.onSurfaceVariant },
    draft: { bg: dashboardTheme.surfaceVariant, text: dashboardTheme.onSurfaceVariant },
    mapped: { bg: dashboardTheme.surfaceContainerLow, text: dashboardTheme.primary },
    not_mapped: { bg: dashboardTheme.errorContainer, text: dashboardTheme.onErrorContainer },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: toneStyles.bg }]}>
      <BhuguardMaterialIcon name={icon === 'verified' ? 'verified' : icon === 'map' ? 'map' : icon === 'schedule' ? 'schedule' : 'location_on'} size={14} color={toneStyles.text} filled={tone === 'verified'} />
      <Text style={[styles.badgeText, { color: toneStyles.text }]}>{label}</Text>
    </View>
  );
}

export function FarmerFarmListCard({
  farm,
  onViewDetails,
  onAddActivity,
  onMapBoundary,
  onViewBoundary,
  onOpenMap,
}: FarmerFarmListCardProps) {
  const verificationLabel =
    farm.verificationBadge === 'verified'
      ? 'Verified'
      : farm.verificationBadge === 'draft'
        ? 'Draft'
        : 'Pending Visit';

  const verificationTone = farm.verificationBadge;
  const verificationIcon = farm.verificationBadge === 'verified' ? 'verified' : farm.verificationBadge === 'draft' ? 'assignment' : 'schedule';

  return (
    <View style={[styles.card, dashboardShadow]}>
      <Pressable style={styles.headerPress} onPress={onViewDetails}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{farm.name}</Text>
          {farm.farmerName ? <Text style={styles.farmerName}>{farm.farmerName}</Text> : null}
          <Text style={styles.code}>ID: {farm.code}</Text>
          <Text style={styles.location}>{farm.locationLabel}</Text>
        </View>

        <View style={styles.badges}>
          <StatusBadge label={verificationLabel} tone={verificationTone} icon={verificationIcon} />
          <StatusBadge
            label={farm.mappingBadge === 'mapped' ? 'Mapped' : 'Not Mapped'}
            tone={farm.mappingBadge}
            icon={farm.mappingBadge === 'mapped' ? 'map' : 'location_on'}
          />
        </View>
      </Pressable>

      <Pressable style={styles.metrics} onPress={onOpenMap}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Boundary</Text>
          <Text style={styles.metricValue}>{farm.boundaryMapped ? 'Yes' : 'No'}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Land Area</Text>
          <Text style={styles.metricValue}>{farm.areaLabel}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>GPS Points</Text>
          <Text style={styles.metricValue}>{farm.boundaryPointCount || '—'}</Text>
        </View>
      </Pressable>

      <View style={styles.conversionRow}>
        <Text style={styles.conversionText}>{farm.hectareLabel}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]} onPress={onViewDetails}>
          <Text style={styles.outlineButtonText}>View Details</Text>
        </Pressable>

        {farm.boundaryMapped ? (
          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} onPress={onViewBoundary}>
            <Text style={styles.secondaryButtonText}>View Boundary</Text>
          </Pressable>
        ) : (
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={onMapBoundary}>
            <Text style={styles.primaryButtonText}>Map Boundary</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={({ pressed }) => [styles.activityButton, pressed && styles.pressed]} onPress={onAddActivity}>
        <Text style={styles.activityButtonText}>Add Activity</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 12,
  },
  headerPress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  farmerName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  code: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  location: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.textMuted,
    marginTop: 2,
  },
  badges: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: dashboardTheme.surface,
    borderRadius: 8,
    padding: 8,
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  conversionText: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  conversionDivider: {
    fontSize: 12,
    color: dashboardTheme.outline,
  },
  metricItem: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: dashboardTheme.outline,
  },
  metricValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.primary,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLow,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: dashboardTheme.primaryContainer,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.primaryContainer,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onPrimary,
  },
  activityButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLow,
  },
  activityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
