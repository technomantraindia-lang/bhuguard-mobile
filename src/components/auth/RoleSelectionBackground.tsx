import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Rect, Stop } from 'react-native-svg';

const GRID_SIZE = 28;
const GRID_LINES = 24;

export function RoleSelectionBackground() {
  const verticalLines = Array.from({ length: GRID_LINES }, (_, index) => index * GRID_SIZE);
  const horizontalLines = Array.from({ length: GRID_LINES }, (_, index) => index * GRID_SIZE);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="roleBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#E3F3EA" />
            <Stop offset="32%" stopColor="#F3FAF6" />
            <Stop offset="100%" stopColor="#FFFFFF" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#roleBg)" />
        {verticalLines.map((x) => (
          <Line key={`v-${x}`} x1={x} y1={0} x2={x} y2="100%" stroke="#E3EBE6" strokeWidth={1} opacity={0.55} />
        ))}
        {horizontalLines.map((y) => (
          <Line key={`h-${y}`} x1={0} y1={y} x2="100%" y2={y} stroke="#E3EBE6" strokeWidth={1} opacity={0.55} />
        ))}
      </Svg>
    </View>
  );
}
