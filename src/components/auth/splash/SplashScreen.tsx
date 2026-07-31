import { StyleSheet, View } from 'react-native';

interface SplashScreenProps {
  /** Kept for callers; logo animation now lives in AnimatedLogoSplash. */
  exitOpacity?: unknown;
}

/**
 * Lightweight Post-App-splash placeholder while Preloader bootstraps.
 * No rectangular artwork and no Reanimated/Worklets.
 */
export function SplashScreen(_props: SplashScreenProps = {}) {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#03150D',
  },
});
