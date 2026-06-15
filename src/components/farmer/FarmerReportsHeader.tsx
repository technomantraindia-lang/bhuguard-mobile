import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';
import { getAuthUser } from '../../storage/authStorage';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

const FARMER_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA0OARnxYpoF-Yvq6sLZPVnMHIHP-1cW4ozhxd4v4EXulqWd6H0so9LpHTgHIH1GvMV0Bv3baPslfo-2gBDF_-iEVLYEqdpuQ8XAYCNyS_2Xc6nOlWCNDNLhhWxLaOy6D0nji9U-vfQ3L1gcYudBAaM84srVrjNzsJBKV-iktjrkrIR6oxr2cFI-RBkn4rARBKjLirUBmzoTa7YPPGd-ICz66YPlqNJ6Ll2Xl0FSbjOXCXnkHImGHC2dQ';

interface FarmerReportsHeaderProps {
  onBack: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
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

export function FarmerReportsHeader({ onBack, onNotificationsPress, onProfilePress }: FarmerReportsHeaderProps) {
  const [displayName, setDisplayName] = useState('Farmer');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    void getAuthUser().then((user) => {
      if (user?.name) {
        setDisplayName(user.name.split(/\s+/)[0] ?? user.name);
      }
    });
  }, []);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={dashboardTheme.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>

      <View style={styles.titleWrap}>
        <BrandedHeaderLogo />
        <Text style={styles.title}>Reports</Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: dashboardTheme.primary,
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
    backgroundColor: dashboardTheme.surface,
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
    width: 32,
    height: 32,
    borderRadius: 16,
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
    backgroundColor: dashboardTheme.secondaryContainer,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onSecondaryContainer,
  },
});
