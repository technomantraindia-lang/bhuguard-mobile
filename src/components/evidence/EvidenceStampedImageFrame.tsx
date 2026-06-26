import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '../../theme/colors';

export const EVIDENCE_PREVIEW_MIN_HEIGHT = 320;
export const EVIDENCE_PREVIEW_HINT = 'Tap image to view full evidence';

interface EvidenceStampedImageFrameProps {
  uri: string;
  onPress?: () => void;
  hint?: string;
  minHeight?: number;
  frameStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function EvidenceStampedImageFrame({
  uri,
  onPress,
  hint = EVIDENCE_PREVIEW_HINT,
  minHeight = EVIDENCE_PREVIEW_MIN_HEIGHT,
  frameStyle,
  imageStyle,
}: EvidenceStampedImageFrameProps) {
  const showHint = Boolean(onPress && hint);
  const usesCustomFrame = frameStyle != null;

  const content = (
    <View style={[styles.frame, usesCustomFrame ? frameStyle : { minHeight }]}>
      <View
        style={[
          styles.imageContainer,
          usesCustomFrame ? styles.imageContainerFlexible : styles.imageContainerFixed,
        ]}
      >
        <Image
          source={{ uri }}
          style={[styles.image, imageStyle]}
          resizeMode="contain"
          accessibilityLabel="Evidence preview"
        />
      </View>
      {showHint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );

  if (!onPress) {
    return <View style={styles.wrapper}>{content}</View>;
  }

  return (
    <Pressable
      style={styles.wrapper}
      onPress={onPress}
      accessibilityRole="imagebutton"
      accessibilityLabel="Open full evidence image"
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  frame: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'column',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  imageContainerFixed: {
    minHeight: EVIDENCE_PREVIEW_MIN_HEIGHT - 48,
  },
  imageContainerFlexible: {
    flex: 1,
    minHeight: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
});
