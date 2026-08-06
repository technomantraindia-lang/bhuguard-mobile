import { useEffect, useState } from 'react';
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

export const EVIDENCE_PREVIEW_MIN_HEIGHT = 220;
export const EVIDENCE_THUMBNAIL_MAX_HEIGHT = 140;
export const EVIDENCE_PREVIEW_HINT = 'Tap image to view full evidence';

interface EvidenceStampedImageFrameProps {
  uri: string;
  onPress?: () => void;
  hint?: string;
  minHeight?: number;
  compact?: boolean;
  frameStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function EvidenceStampedImageFrame({
  uri,
  onPress,
  hint = EVIDENCE_PREVIEW_HINT,
  minHeight = EVIDENCE_PREVIEW_MIN_HEIGHT,
  compact = false,
  frameStyle,
  imageStyle,
}: EvidenceStampedImageFrameProps) {
  const [aspectRatio, setAspectRatio] = useState(3 / 4);
  const showHint = Boolean(onPress && hint && !compact);
  const usesCustomFrame = frameStyle != null;
  const frameMinHeight = compact ? EVIDENCE_THUMBNAIL_MAX_HEIGHT : minHeight;

  useEffect(() => {
    let active = true;

    Image.getSize(
      uri,
      (width, height) => {
        if (active && width > 0 && height > 0) {
          setAspectRatio(width / height);
        }
      },
      () => {
        if (active) {
          setAspectRatio(3 / 4);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [uri]);

  const content = (
    <View style={[styles.frame, usesCustomFrame ? frameStyle : { minHeight: frameMinHeight }]}>
      <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { aspectRatio },
            compact ? styles.imageCompact : null,
            imageStyle,
          ]}
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
    backgroundColor: colors.background,
    paddingVertical: 4,
  },
  imageContainerCompact: {
    maxHeight: EVIDENCE_THUMBNAIL_MAX_HEIGHT,
  },
  image: {
    width: '100%',
    alignSelf: 'center',
  },
  imageCompact: {
    maxHeight: EVIDENCE_THUMBNAIL_MAX_HEIGHT - 8,
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
