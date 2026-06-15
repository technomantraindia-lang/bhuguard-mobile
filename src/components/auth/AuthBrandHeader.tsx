import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface AuthBrandHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AuthBrandHeader({ title = 'Bhuguard', showBack = true, onBack }: AuthBrandHeaderProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.wrap}>
      {showBack ? (
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
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
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <Text style={styles.title}>{title}</Text>
      <View style={styles.backPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    backgroundColor: dashboardTheme.surfaceContainer,
    transform: [{ scale: 0.95 }],
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.primary,
    letterSpacing: 0.2,
  },
});
