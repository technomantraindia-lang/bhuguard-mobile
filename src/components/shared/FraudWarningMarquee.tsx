import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '../../i18n/I18nContext';

const STRIP_HEIGHT = 28;

type FraudWarningMarqueeProps = {
  /** When false, the strip is not rendered (camera / map draw / fullscreen). */
  visible?: boolean;
};

function FraudWarningMarqueeComponent({ visible = true }: FraudWarningMarqueeProps) {
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [textWidth, setTextWidth] = useState(0);

  const message = useMemo(() => t('fraudWarning.marquee'), [t, language]);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) {
        setReduceMotion(Boolean(enabled));
      }
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    translateX.stopAnimation();
    translateX.setValue(0);

    if (!visible || reduceMotion || textWidth <= 0) {
      return;
    }

    const distance = textWidth + width;
    const duration = Math.max(14000, distance * 18);

    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -distance,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    // Start just off the right edge.
    translateX.setValue(width);
    loop.start();

    return () => {
      loop.stop();
    };
  }, [visible, reduceMotion, textWidth, width, translateX, message]);

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[styles.wrap, { paddingTop: Math.max(insets.top, 0), height: STRIP_HEIGHT + Math.max(insets.top, 0) }]}
      accessibilityRole="text"
      accessibilityLabel={t('fraudWarning.accessibilityLabel')}
      importantForAccessibility="yes"
    >
      <View style={styles.strip} accessibilityElementsHidden={false}>
        {reduceMotion ? (
          <Text style={styles.text} numberOfLines={1}>
            {message}
          </Text>
        ) : (
          <Animated.Text
            style={[styles.text, { transform: [{ translateX }] }]}
            onLayout={(event) => {
              const next = Math.ceil(event.nativeEvent.layout.width);
              setTextWidth((current) => (current === next ? current : next));
            }}
            numberOfLines={1}
          >
            {message}
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

export const FraudWarningMarquee = memo(FraudWarningMarqueeComponent);
export const FRAUD_MARQUEE_STRIP_HEIGHT = STRIP_HEIGHT;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#3A120F',
    zIndex: 50,
  },
  strip: {
    height: STRIP_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    position: 'absolute',
    left: 0,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFE8E4',
    letterSpacing: 0.2,
    paddingHorizontal: 12,
  },
});
