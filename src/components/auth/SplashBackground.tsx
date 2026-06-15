import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export function SplashBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="splashGradient" cx="50%" cy="38%" rx="72%" ry="72%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="55%" stopColor="#F4FBF6" />
            <Stop offset="100%" stopColor="#E3F5EA" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#splashGradient)" />
      </Svg>
    </View>
  );
}
