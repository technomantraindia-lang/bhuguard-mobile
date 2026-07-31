import type { ComponentType, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type BlurViewProps = {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export type LinearGradientProps = {
  colors: readonly string[];
  locations?: readonly number[] | null;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Native blur is disabled — expo-blur crashes on Fabric in the current dev client build. */
export function getBlurView(): ComponentType<BlurViewProps> | null {
  return null;
}

/** Native gradient is disabled — expo-linear-gradient crashes on Fabric in the current dev client build. */
export function getLinearGradient(): ComponentType<LinearGradientProps> | null {
  return null;
}
