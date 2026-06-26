import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export function SplashBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="splashSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="45%" stopColor="#F4FBF6" />
            <Stop offset="100%" stopColor="#DDF3E6" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#splashSky)" />
        <Circle cx="18%" cy="16%" r="72" fill="#0B6B3A14" />
        <Circle cx="86%" cy="22%" r="54" fill="#1E3A8A10" />
        <Circle cx="74%" cy="78%" r="96" fill="#0B6B3A10" />
      </Svg>
    </View>
  );
}
