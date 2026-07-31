import { ImageBackground, StyleSheet, View } from 'react-native';

import { authBrand } from '../../theme/authBrand';

const BACKGROUND = require('../../../assets/auth-environment-bg.jpg');

interface AuthFlowBackgroundProps {
  /** Higher = darker overlay for text readability (0–1). */
  overlayOpacity?: number;
}

/**
 * Full-screen farm backdrop for auth screens with a dark readability overlay.
 */
export function AuthFlowBackground({ overlayOpacity = 0.42 }: AuthFlowBackgroundProps) {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <View style={[styles.fill, styles.base]} />
      <ImageBackground source={BACKGROUND} style={[styles.fill, styles.image]} resizeMode="cover" />
      <View style={[styles.fill, styles.scrim, { backgroundColor: `rgba(4, 22, 14, ${overlayOpacity})` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  base: {
    backgroundColor: authBrand.primary,
  },
  image: {
    opacity: 0.92,
  },
  scrim: {},
});
