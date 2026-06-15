import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { BrandedHeaderLogo } from '../../shared/BrandedHeaderLogo';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmerProfileHeaderProps {
  onBack: () => void;
  onNotificationsPress: () => void;
}

export function FarmerProfileHeader({ onBack, onNotificationsPress }: FarmerProfileHeaderProps) {
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
        <Text style={styles.title}>My Profile</Text>
      </View>

      <Pressable style={styles.notificationButton} onPress={onNotificationsPress}>
        <BhuguardMaterialIcon name="notifications" size={22} color={dashboardTheme.primary} />
        <View style={styles.dot} />
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: dashboardTheme.error,
  },
});
