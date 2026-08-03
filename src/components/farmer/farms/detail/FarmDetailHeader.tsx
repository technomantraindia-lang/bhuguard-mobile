import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandedHeaderLogo } from '../../../shared/BrandedHeaderLogo';
import { BhuguardMaterialIcon } from '../../../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';

interface FarmDetailHeaderProps {
  farmName: string;
  onBack: () => void;
  onNotificationsPress: () => void;
  onEditPress: () => void;
}

export function FarmDetailHeader({
  farmName,
  onBack,
  onNotificationsPress,
  onEditPress,
}: FarmDetailHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable style={styles.iconButton} onPress={onBack} accessibilityLabel="Go back">
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

        <BrandedHeaderLogo size={32} />

        <View style={styles.titleCopy}>
          <Text style={styles.title}>Farm Details</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {farmName}
          </Text>
        </View>

        <Pressable style={styles.iconButton} onPress={onNotificationsPress} accessibilityLabel="Notifications">
          <BhuguardMaterialIcon name="notifications" size={22} color={dashboardTheme.primary} />
        </Pressable>

        <Pressable style={styles.iconButton} onPress={onEditPress} accessibilityLabel="Edit farm">
          <Text style={styles.pencilGlyph}>✎</Text>
        </Pressable>
      </View>

      <Text style={styles.screenSubtitle}>View farm boundary, location and project information.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: dashboardTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilGlyph: {
    fontSize: 20,
    lineHeight: 22,
    color: dashboardTheme.primary,
    fontWeight: '600',
  },
  titleCopy: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
    paddingLeft: 4,
  },
});
