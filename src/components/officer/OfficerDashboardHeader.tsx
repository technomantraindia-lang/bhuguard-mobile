import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerDashboardHeaderProps {
  officerName: string;
  onNotificationsPress?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'FO';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function OfficerDashboardHeader({ officerName, onNotificationsPress }: OfficerDashboardHeaderProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.leading}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
        </View>
        <View>
          <Text style={styles.brand}>Bhuguard MRV</Text>
          <Text style={styles.officerName}>{officerName}</Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        onPress={onNotificationsPress}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
    ...officerCardShadow,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: officerTheme.secondaryFixed,
    borderWidth: 2,
    borderColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: officerTheme.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  brand: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  officerName: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
