import { memo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BACKGROUND = require('../../../../assets/auth-environment-bg.jpg');

/**
 * Full-bleed local farm photo with a light readable overlay (not a heavy dark wash).
 */
function LoginBackgroundComponent() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} collapsable={false}>
      <ImageBackground
        source={BACKGROUND}
        style={styles.image}
        resizeMode="cover"
        imageStyle={styles.imageInner}
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(248, 252, 245, 0.42)', 'rgba(232, 245, 228, 0.28)', 'rgba(8, 42, 24, 0.55)']}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.bottomScrim} />
    </View>
  );
}

export const LoginBackground = memo(LoginBackgroundComponent);

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageInner: {
    width: '100%',
    height: '100%',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
    backgroundColor: 'rgba(3, 28, 18, 0.42)',
  },
});
