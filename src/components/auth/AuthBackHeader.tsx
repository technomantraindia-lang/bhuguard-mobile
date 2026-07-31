import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { safeAuthGoBack } from '../../navigation/safeAuthBack';
import type { RootStackParamList } from '../../navigation/types';
import { authBrand } from '../../theme/authBrand';

interface AuthBackHeaderProps {
  onBack?: () => void;
  fallbackRoute?: keyof RootStackParamList;
}

export function AuthBackHeader({ onBack, fallbackRoute = 'MobileLogin' }: AuthBackHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onBack ?? (() => safeAuthGoBack(navigation, fallbackRoute))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={authBrand.tertiary}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authBrand.white,
    borderWidth: 1,
    borderColor: 'rgba(11, 46, 31, 0.1)',
    shadowColor: '#02120C',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: '#F0F7F2',
    transform: [{ scale: 0.96 }],
  },
});
