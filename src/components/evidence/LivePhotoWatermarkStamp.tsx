import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { LivePhotoWatermarkMeta } from '../../utils/livePhotoWatermarkFormat';
import { getLivePhotoWatermarkLines } from '../../utils/livePhotoWatermarkFormat';

interface LivePhotoWatermarkStampProps {
  meta: LivePhotoWatermarkMeta;
  imageWidth: number;
  style?: StyleProp<ViewStyle>;
}

export function LivePhotoWatermarkStamp({ meta, imageWidth, style }: LivePhotoWatermarkStampProps) {
  const fontSize = Math.max(11, Math.round(imageWidth * 0.032));
  const lineHeight = Math.round(fontSize * 1.25);
  const padding = Math.max(8, Math.round(imageWidth * 0.02));

  return (
    <View pointerEvents="none" style={[styles.wrap, { padding }, style]}>
      {getLivePhotoWatermarkLines(meta).map((line, index) => (
        <Text
          key={`${line}-${index}`}
          style={[
            styles.line,
            {
              fontSize,
              lineHeight,
            },
          ]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    maxWidth: '92%',
  },
  line: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
