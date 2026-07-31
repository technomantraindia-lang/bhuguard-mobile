import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { useProfilePhotoDisplay } from '../../hooks/useProfilePhotoDisplay';
import { useTranslation } from '../../i18n/I18nContext';
import { farmerTheme } from '../../theme/farmerTheme';
import { BhuguardLogo } from '../shared/BhuguardLogo';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';

interface FarmerDashboardHeaderProps {
  firstName: string;
  fullName?: string;
  photoUrl?: string | null;
  greeting?: string;
  subtitle?: string;
  unreadCount?: number;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

function getGreetingKey(): 'farmer.dashboard.greetingMorning' | 'farmer.dashboard.greetingAfternoon' | 'farmer.dashboard.greetingEvening' {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'farmer.dashboard.greetingMorning';
  }

  if (hour < 17) {
    return 'farmer.dashboard.greetingAfternoon';
  }

  return 'farmer.dashboard.greetingEvening';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'FR';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function FarmerDashboardHeader({
  firstName,
  fullName,
  photoUrl,
  greeting,
  subtitle,
  unreadCount = 0,
  onNotificationsPress,
  onProfilePress,
}: FarmerDashboardHeaderProps) {
  const { t } = useTranslation();
  const displayUri = useProfilePhotoDisplay(photoUrl, 'farmer-dashboard-avatar.jpg');
  const initialsSource = (fullName ?? firstName).trim() || 'Farmer';
  const displayName = firstName.trim() || 'Farmer';
  const resolvedGreeting = greeting ?? t(getGreetingKey());
  const resolvedSubtitle = subtitle ?? t('farmer.dashboard.subtitle');
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <BhuguardLogo size={LOGO_SIZES.dashboardHeader} animation="none" />
        <View style={styles.copy}>
          <Text style={styles.greeting} numberOfLines={2}>
            {resolvedGreeting}, {displayName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {resolvedSubtitle}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <BhuguardMaterialIcon name="notifications" size={22} color={farmerTheme.actionGreen} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.avatarButton, pressed && styles.iconPressed]}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {displayUri ? (
            <Image source={{ uri: displayUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(initialsSource)}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: farmerTheme.white,
    borderBottomWidth: 1,
    borderBottomColor: farmerTheme.softBorder,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: farmerTheme.headingGreen,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: farmerTheme.secondaryText,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: farmerTheme.lightGreenSurface,
    borderWidth: 1,
    borderColor: farmerTheme.softBorder,
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: farmerTheme.white,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  iconPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: farmerTheme.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: farmerTheme.actionGreen,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: farmerTheme.white,
  },
});
