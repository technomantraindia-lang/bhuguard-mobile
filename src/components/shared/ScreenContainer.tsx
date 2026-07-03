import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';

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
  const content = (
    <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );

  if (!keyboardAvoiding) {
    return content;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <View style={styles.flex}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});
