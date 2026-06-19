import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerFormScreenHeaderProps {
  title: string;
  onBack: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
}

const FARMER_AVATAR_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCSEIQqJ3hcpPTagoMzaDqCGTXcZhiGZId4oDiOIZGS8YaMUlyHjcA08x9PFXwF3SD7DXY-8q2YhxeEl-OmmEiKyVDhPK5nRMvwfLV0wJ95FUFNrp-ICRLOBGyoz7Gi4rLypvXbJqbrAQh4_ELHn1bi3i3qj7J_D7rl-WnxNxP_HDdfqs1BKGauuVOCn3RUFIvV2EJUnryfafb5PD69BJyaLRVaTAzRM8-ufQ0LwfX6B7QfsieJwqZT5NNen9rYQkZXr94IPFJM49Xe';

export function FarmerFormScreenHeader({
  title,
  onBack,
  onNotificationsPress,
  onProfilePress,
}: FarmerFormScreenHeaderProps) {
  return (
    <View style={[styles.wrap, dashboardShadow]}>
      <View style={styles.left}>
        <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={dashboardTheme.onSurfaceVariant}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={onNotificationsPress} accessibilityLabel="Notifications">
          <BhuguardMaterialIcon name="notifications" size={22} color={dashboardTheme.onSurfaceVariant} />
        </Pressable>
        <Pressable style={styles.avatarButton} onPress={onProfilePress}>
          <Image source={{ uri: FARMER_AVATAR_URI }} style={styles.avatarImage} />
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
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingRight: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 32,
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
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
