import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../../constants/branding';
import { officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardLogo } from '../../shared/BhuguardLogo';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface OfficerVisitsHeaderProps {
  officerName: string;
  onBackPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
}

function getInitials(name: string): string {
  const safeName = name?.trim() ? name : 'Field Officer';
  const parts = safeName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'FO';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function OfficerVisitsHeader({
  officerName,
  onBackPress,
  onNotificationsPress,
  onProfilePress,
}: OfficerVisitsHeaderProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        onPress={onBackPress}
        accessibilityRole="button"
        accessibilityLabel="Back to dashboard"
      >
        <View style={styles.backIcon}>
          <BhuguardMaterialIcon name="arrow_forward" size={20} color={officerTheme.primary} />
        </View>
      </Pressable>

      <View style={styles.center}>
        <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
        <Text style={styles.title}>Assigned Visits</Text>
      </View>

      <View style={styles.trailing}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Officer profile"
        >
          <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: officerTheme.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: officerTheme.marginMobile,
    paddingVertical: 8,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.primary,
    letterSpacing: 0.3,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: officerTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
});
