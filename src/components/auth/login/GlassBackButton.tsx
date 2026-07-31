import { memo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { loginTheme } from './Theme';

interface GlassBackButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

function GlassBackButtonComponent({ onPress, disabled = false }: GlassBackButtonProps) {
  const locked = useRef(false);

  return (
    <Pressable
      onPress={() => {
        if (disabled || locked.current) {
          return;
        }
        locked.current = true;
        onPress();
        setTimeout(() => {
          locked.current = false;
        }, 600);
      }}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={8}
    >
      <View style={styles.inner}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18l-6-6 6-6"
            stroke={loginTheme.darkText}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

export const GlassBackButton = memo(GlassBackButtonComponent);

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: loginTheme.cream,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: loginTheme.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: '#EDE8D4',
  },
  disabled: {
    opacity: 0.55,
  },
});
