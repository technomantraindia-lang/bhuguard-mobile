import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { useProfilePhotoDisplay } from '../../hooks/useProfilePhotoDisplay';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BhuguardLogo } from '../shared/BhuguardLogo';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';

interface OfficerDashboardHeaderProps {
  officerName: string;
  photoUrl?: string | null;
  unreadCount?: number;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
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

export function OfficerDashboardHeader({
  officerName,
  photoUrl,
  unreadCount = 0,
  onNotificationsPress,
  onProfilePress,
}: OfficerDashboardHeaderProps) {
  const displayUri = useProfilePhotoDisplay(photoUrl, 'officer-dashboard-avatar.jpg');
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <View style={styles.bar}>
      <View style={styles.leading}>
        <BhuguardLogo size={LOGO_SIZES.dashboardHeader} />
        <View style={styles.copy}>
          <Text style={styles.brand} numberOfLines={1}>
            Bhuguard
          </Text>
          <Text style={styles.officerName} numberOfLines={1}>
            {officerName}
          </Text>
        </View>
      </View>

      <View style={styles.trailing}>
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{getInitials(officerName)}</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <BhuguardMaterialIcon name="notifications" size={22} color={officerTheme.primary} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
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
    ...officerCardShadow,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: officerTheme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  brand: {
    fontSize: 17,
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
    backgroundColor: officerTheme.surfaceLow,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});

