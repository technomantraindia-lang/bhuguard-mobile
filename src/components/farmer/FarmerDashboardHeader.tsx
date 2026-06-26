import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { useProfilePhotoDisplay } from '../../hooks/useProfilePhotoDisplay';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerDashboardHeaderProps {
  firstName: string;
  fullName?: string;
  photoUrl?: string | null;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good Morning';
  }

  if (hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
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
  onNotificationsPress,
  onProfilePress,
}: FarmerDashboardHeaderProps) {
  const displayUri = useProfilePhotoDisplay(photoUrl, 'farmer-dashboard-avatar.jpg');
  const initialsSource = (fullName ?? firstName).trim() || 'Farmer';
  const displayName = firstName.endsWith('bhai') ? firstName : `${firstName}bhai`;

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <BrandedHeaderLogo size={LOGO_SIZES.dashboardHeader} />
        <View style={styles.copy}>
          <Text style={styles.greeting} numberOfLines={2}>
            {getGreeting()}, {displayName}
          </Text>
          <Text style={styles.subtitle}>Your Bhuguard farm dashboard</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <BhuguardMaterialIcon name="notifications" size={24} color={dashboardTheme.primary} />
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
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: dashboardTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  copy: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: dashboardTheme.textMuted,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  iconPressed: {
    backgroundColor: `${dashboardTheme.secondaryContainer}80`,
    transform: [{ scale: 0.95 }],
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: dashboardTheme.surfaceLowest,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceLow,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
});
