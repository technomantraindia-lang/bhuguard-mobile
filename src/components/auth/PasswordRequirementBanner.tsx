import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

export function PasswordRequirementBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={dashboardTheme.primary} strokeWidth={1.8} />
          <Path d="M12 10v6M12 8h.01" stroke={dashboardTheme.primary} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </View>
      <Text style={styles.text}>Password must be at least 8 characters with a mix of letters and numbers.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  iconWrap: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: dashboardTheme.primary,
  },
});
