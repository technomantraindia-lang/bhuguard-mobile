import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

export function SecurityNoteBanner() {
  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
            fill={dashboardTheme.primary}
          />
        </Svg>
      </View>
      <Text style={styles.text}>
        <Text style={styles.bold}>Security Note: </Text>
        Avoid using simple patterns like 123456, repeating numbers, or parts of your birth date.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  iconWrap: {
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: dashboardTheme.primary,
  },
  bold: {
    fontWeight: '700',
  },
});
