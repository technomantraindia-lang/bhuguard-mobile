import { memo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BACKGROUND = require('../../../../assets/auth-environment-bg.jpg');

/**
 * Full-screen farm background for Login / OTP.
 * Absolute fill + resizeMode cover — no white top / image bottom split.
 */
function LoginBackgroundComponent() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} collapsable={false}>
      <ImageBackground
        source={BACKGROUND}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        {/* Subtle readability wash — does not hide the farm image */}
        <LinearGradient
          colors={[
            'rgba(247, 251, 253, 0.42)',
            'rgba(247, 251, 253, 0.12)',
            'rgba(11, 59, 40, 0.28)',
            'rgba(11, 59, 40, 0.45)',
          ]}
          locations={[0, 0.28, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>
    </View>
  );
}

export const LoginBackground = memo(LoginBackgroundComponent);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
