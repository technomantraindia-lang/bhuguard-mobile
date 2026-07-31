import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

type PlantHeroIllustrationProps = {
  size?: number;
};

/**
 * Local plant/pot hero for the premium login screen.
 * Easy to replace later with an Image asset without changing LoginScreen layout.
 */
function PlantHeroIllustrationComponent({ size = 180 }: PlantHeroIllustrationProps) {
  const width = size;
  const height = Math.round(size * 1.12);

  return (
    <View style={[styles.wrap, { width, height }]} accessibilityLabel="Plant illustration">
      <Svg width={width} height={height} viewBox="0 0 200 224" fill="none">
        <Ellipse cx="100" cy="198" rx="54" ry="10" fill="rgba(0,0,0,0.22)" />
        <Path
          d="M62 148c0-6 8-10 38-10s38 4 38 10v34c0 10-12 18-38 18s-38-8-38-18v-34z"
          fill="#2A5A28"
        />
        <Path
          d="M68 150c2-4 12-7 32-7s30 3 32 7c-2 4-12 7-32 7s-30-3-32-7z"
          fill="#3D7A35"
        />
        <Path d="M96 86c-2 18-2 40-2 62h12c0-22 0-44-2-62z" fill="#1F4D22" />
        <Path
          d="M102 92c-22-28-48-34-58-28 18 12 34 34 42 58 8-12 14-22 16-30z"
          fill="#7BC24A"
        />
        <Path
          d="M102 96c22-30 48-36 58-28-18 12-34 34-42 58-8-12-14-22-16-30z"
          fill="#A6D94B"
        />
        <Path
          d="M100 78c-10-26-30-40-44-38 16 14 28 36 34 56 6-8 8-14 10-18z"
          fill="#8FD45A"
        />
        <Path
          d="M100 78c10-26 30-40 44-38-16 14-28 36-34 56-6-8-8-14-10-18z"
          fill="#B8E86A"
        />
        <Circle cx="100" cy="70" r="7" fill="#CFEFA0" opacity={0.9} />
      </Svg>
    </View>
  );
}

export const PlantHeroIllustration = memo(PlantHeroIllustrationComponent);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
