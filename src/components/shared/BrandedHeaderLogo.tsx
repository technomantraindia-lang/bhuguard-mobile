import { StyleSheet, View } from 'react-native';

import { LOGO_SIZES } from '../../constants/branding';
import { useNavigateToFarmerDashboard } from '../../hooks/useBrandedNavigation';
import { BhuguardLogo } from './BhuguardLogo';

interface BrandedHeaderLogoProps {
  size?: number;
  onPress?: () => void;
}

export function BrandedHeaderLogo({ size = LOGO_SIZES.moduleHeader, onPress }: BrandedHeaderLogoProps) {
  const goDashboard = useNavigateToFarmerDashboard();

  return (
    <View style={styles.wrap}>
      <BhuguardLogo size={size} onPress={onPress ?? goDashboard} accessibilityLabel="Go to dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 8,
  },
});
