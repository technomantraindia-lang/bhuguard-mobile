import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

export function ResetPasswordHeroIcon() {
  return (
    <View style={styles.wrap}>
      <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <Path
          d="M20 6a10 10 0 00-8.66 5M20 6a10 10 0 018.66 5M20 6V3"
          stroke={dashboardTheme.primary}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M8 14v8a12 12 0 0024 0v-8"
          stroke={dashboardTheme.primary}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Rect x={15} y={18} width={10} height={8} rx={2} stroke={dashboardTheme.primary} strokeWidth={2} />
        <Path d="M17 18v-2a3 3 0 016 0v2" stroke={dashboardTheme.primary} strokeWidth={2} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
