import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../shared/BrandedHeaderLogo';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerFarmsHeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  unreadCount?: number;
  onNotificationsPress: () => void;
}

export function FarmerFarmsHeader({
  showBack = false,
  onBack,
  unreadCount = 0,
  onNotificationsPress,
}: FarmerFarmsHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {showBack ? (
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
        ) : null}

        <BrandedHeaderLogo />
        <View>
          <Text style={styles.title}>My Farms</Text>
          <Text style={styles.subtitle}>Manage your registered farm lands</Text>
        </View>
      </View>

      <Pressable style={styles.notificationButton} onPress={onNotificationsPress}>
        <BhuguardMaterialIcon name="notifications" size={24} color={dashboardTheme.primary} />
        {unreadCount > 0 ? <View style={styles.notificationDot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: dashboardTheme.surface,
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
    fontWeight: '700',
    color: dashboardTheme.primary,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
});
