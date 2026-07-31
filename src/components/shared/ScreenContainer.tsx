import type { ReactNode } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { KeyboardAwareScreen } from '../layout/KeyboardAwareScreen';

interface ScreenContainerProps {
  children: ReactNode;
  edges?: Edge[];
  backgroundColor?: string;
  keyboardAvoiding?: boolean;
  style?: ViewStyle;
}

/** Standard safe-area shell for stack screens (top inset only by default). */
export function ScreenContainer({
  children,
  edges = ['top'],
  backgroundColor = colors.background,
  keyboardAvoiding = false,
  style,
}: ScreenContainerProps) {
  if (!keyboardAvoiding) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAwareScreen
      edges={edges}
      backgroundColor={backgroundColor}
      style={style}
      scroll
      contentContainerStyle={styles.grow}
    >
      {children}
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  grow: { flexGrow: 1 },
});
