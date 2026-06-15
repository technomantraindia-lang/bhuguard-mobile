import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';
import { getAuthUser } from '../../storage/authStorage';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

const FARMER_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCl8WfGQ6kctvOTe90a6Tw8LjT3DlDOLUu3TSxopEgNsTzB2T2nYqHwfjZfuqagv_GJxiyvdUHFAgQbmSc2L1HzbLOJZhk66SOk46DbVwB83d_dJoNGRyQqqdkLY0r0p0khCU63RajP3PczEe5fsmq9twtCFDTmPDub_THe37Zt2HSw5dwq1vZsRUtrPLq-FjRoCsf0X58st4UhKXJKxFDeDDsANUgZOpD_ywm6ek3Fin7BK3Lf_OU42Q';

interface FarmerSubmitActivityHeaderProps {
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

export function FarmerSubmitActivityHeader({
  onBack,
  onNotificationsPress,
  onProfilePress,
}: FarmerSubmitActivityHeaderProps) {
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
      <View style={styles.left}>
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

        <BrandedHeaderLogo />
        <View>
          <Text style={styles.title}>Submit Activity</Text>
          <Text style={styles.subtitle}>Log your recent farm work</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.iconButton, dashboardShadow]} onPress={onNotificationsPress}>
          <BhuguardMaterialIcon name="notifications" size={22} color={dashboardTheme.primary} />
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
    backgroundColor: `${dashboardTheme.background}E6`,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
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
    backgroundColor: dashboardTheme.surface,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.onSecondaryContainer,
  },
});
