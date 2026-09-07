import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerFarmViewModel } from '../../utils/farmMapHelpers';

interface FarmerFarmListCardProps {
  farm: FarmerFarmViewModel;
  onViewActivities: () => void;
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

export function FarmerFarmListCard({ farm, onViewActivities }: FarmerFarmListCardProps) {
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
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.fieldLabel}>Farm Name</Text>
          <Text style={styles.name}>{farm.name}</Text>
          {farm.farmerName ? (
            <>
              <Text style={styles.fieldLabel}>Farmer Name</Text>
              <Text style={styles.farmerName}>{farm.farmerName}</Text>
            </>
          ) : null}
          <Text style={styles.fieldLabel}>Farm ID</Text>
          <Text style={styles.code}>{farm.code}</Text>
          <Text style={styles.fieldLabel}>Village</Text>
          <Text style={styles.location}>{farm.village}</Text>
        </View>

        <View style={styles.badges}>
          <StatusBadge label={verificationLabel} tone={verificationTone} icon={verificationIcon} />
          <StatusBadge
            label={farm.mappingBadge === 'mapped' ? 'Mapped' : 'Mapping Pending'}
            tone={farm.mappingBadge}
            icon={farm.mappingBadge === 'mapped' ? 'map' : 'location_on'}
          />
        </View>
      </View>

      <View style={styles.areaBlock}>
        <Text style={styles.metricLabel}>Area</Text>
        <Text style={styles.metricValue}>{farm.hectareLabel}</Text>
      </View>

      <Pressable style={({ pressed }) => [styles.activityButton, pressed && styles.pressed]} onPress={onViewActivities}>
        <Text style={styles.activityButtonText}>View Activities</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: dashboardTheme.outline,
    marginTop: 2,
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
  areaBlock: {
    backgroundColor: dashboardTheme.surface,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: dashboardTheme.outline,
  },
  metricValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
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
