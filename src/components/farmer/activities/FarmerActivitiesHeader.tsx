import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../../shared/BrandedHeaderLogo';
import { getAuthUser } from '../../../storage/authStorage';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

const FARMER_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCE1Yu-QwiAEZE-RCBWlMqPXqooGk9VcgQqDajZZTq3CkzwESpIHmzcbXuLt2RrEGXG71QOWME9NaSkb1UdyV3sy7OkPrqGIkfQdSUID4TLhaiMrfAyOvFZB439TdTTczxzb_iCVR6nkCDfXq6biXaQF-narwV9t7HQGDZyq0Y2XoNcES2KFv-QmvizXYpb3VBzmpoLSAqAh8ULizJ53BUr2dOsGF0Y-Sj5sGYRJBwKdRSD_LC9lF-9gw';

interface FarmerActivitiesHeaderProps {
  onNotificationsPress: () => void;
  onProfilePress: () => void;
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

export function FarmerActivitiesHeader({ onNotificationsPress, onProfilePress }: FarmerActivitiesHeaderProps) {
  const [displayName, setDisplayName] = useState('Farmer');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    void getAuthUser().then((user) => {
      if (user?.name) {
        setDisplayName(user.name);
      }
    });
  }, []);

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <BrandedHeaderLogo />
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Farm Activity</Text>
            <Text style={styles.subtitle}>Manage your farm updates every 20 days</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.iconButton, dashboardShadow]} onPress={onNotificationsPress}>
          <BhuguardMaterialIcon name="notifications" size={22} color={dashboardTheme.primary} />
          <View style={styles.notificationDot} />
        </Pressable>

        <Pressable style={styles.avatarButton} onPress={onProfilePress}>
          {!imageError ? (
            <Image
              source={{ uri: FARMER_AVATAR_URI }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
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
    paddingVertical: 12,
    backgroundColor: dashboardTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  copy: {
    flex: 1,
    paddingRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.error,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.surfaceVariant,
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
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
});
