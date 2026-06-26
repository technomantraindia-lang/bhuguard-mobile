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
      <View style={styles.leading}>
        {onBackPress ? (
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            onPress={onBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BhuguardMaterialIcon name="arrow_back" size={22} color={officerTheme.primary} />
          </Pressable>
        ) : (
          <BhuguardLogo size={LOGO_SIZES.moduleHeader} />
        )}

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            Assigned Visits
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Field verification queue
          </Text>
        </View>
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
    paddingVertical: 10,
    backgroundColor: officerTheme.surfaceLowest,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    paddingRight: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: officerTheme.headingGreen,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: officerTheme.onSurfaceVariant,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLow,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
