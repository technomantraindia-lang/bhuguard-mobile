import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface AuthBackHeaderProps {
  onBack?: () => void;
}

export function AuthBackHeader({ onBack }: AuthBackHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onBack ?? (() => navigation.goBack())}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={dashboardTheme.onSurface}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 8,
    paddingBottom: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: dashboardTheme.surfaceContainer,
    transform: [{ scale: 0.95 }],
  },
});
