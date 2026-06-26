import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FarmerActivityServiceItem } from '../../../constants/farmerActivityServices';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface FarmerActivityServiceCardProps {
  service: FarmerActivityServiceItem;
  onPress: () => void;
  onActionPress?: () => void;
}

export function FarmerActivityServiceCard({ service, onPress, onActionPress }: FarmerActivityServiceCardProps) {
  const isActive = service.status === 'active';
  const actionLabel = isActive ? 'Open' : 'Coming Soon';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, dashboardShadow, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, isActive ? styles.iconWrapActive : styles.iconWrapUpcoming]}>
            <BhuguardMaterialIcon name={isActive ? 'eco' : 'schedule'} size={22} color={dashboardTheme.primaryContainer} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{service.name}</Text>
            <Text style={styles.subtitle}>{isActive ? 'Record and submit biochar production.' : 'Available in a future release.'}</Text>
          </View>
        </View>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeUpcoming]}>
          <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextUpcoming]}>
            {service.statusLabel}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.actionButton,
          isActive ? styles.actionButtonActive : styles.actionButtonDisabled,
          pressed && isActive && styles.pressed,
        ]}
        onPress={(event) => {
          event.stopPropagation();
          if (isActive) {
            onActionPress?.();
          } else {
            onPress();
          }
        }}
        disabled={!isActive && !onPress}
      >
        <Text style={[styles.actionText, isActive ? styles.actionTextActive : styles.actionTextDisabled]}>
          {actionLabel}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 12,
  },
  header: {
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: dashboardTheme.surfaceLow,
  },
  iconWrapUpcoming: {
    backgroundColor: '#F3F4F6',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.textMuted,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeUpcoming: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: dashboardTheme.primaryContainer,
  },
  badgeTextUpcoming: {
    color: '#CA8A04',
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: dashboardTheme.primaryContainer,
  },
  actionButtonDisabled: {
    backgroundColor: dashboardTheme.surfaceLow,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionTextActive: {
    color: dashboardTheme.onPrimary,
  },
  actionTextDisabled: {
    color: dashboardTheme.textMuted,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
