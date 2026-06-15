import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmerAddFarmHeaderProps {
  onBack: () => void;
}

export function FarmerAddFarmHeader({ onBack }: FarmerAddFarmHeaderProps) {
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

      <View style={styles.copy}>
        <Text style={styles.title}>Add New Farm</Text>
        <Text style={styles.subtitle}>Register your farm or plot details</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  copy: {
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
});
