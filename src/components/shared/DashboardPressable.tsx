import type { ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type DashboardPressableVariant = 'card' | 'button' | 'row';

interface DashboardPressableProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  variant?: DashboardPressableVariant;
  style?: PressableProps['style'];
}

export function DashboardPressable({
  children,
  variant = 'card',
  style,
  ...props
}: DashboardPressableProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        variant === 'button' && styles.buttonBase,
        pressed && variant === 'card' && styles.cardPressed,
        pressed && variant === 'row' && styles.rowPressed,
        pressed && variant === 'button' && styles.buttonPressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {({ pressed }) =>
        variant === 'button' && pressed ? (
          <View style={styles.ripple}>{children}</View>
        ) : (
          children
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.96,
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  buttonBase: {
    overflow: 'hidden',
    borderRadius: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
  },
  ripple: {
    backgroundColor: `${dashboardTheme.primaryContainer}22`,
  },
});
