import { memo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const BACKGROUND = require('../../../../assets/auth-environment-bg.jpg');

/** Full-screen farm photo with a single green tint and soft bottom depth (no stacked dark cards). */
function LoginBackgroundComponent() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} collapsable={false}>
      <ImageBackground
        source={BACKGROUND}
        style={styles.image}
        resizeMode="cover"
        imageStyle={styles.imageInner}
      />
      <View style={styles.overlayUniform} />
      <View style={styles.overlayBottom} />
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
  overlayUniform: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 38, 21, 0.35)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '52%',
    backgroundColor: 'rgba(1, 31, 17, 0.68)',
  },
});
