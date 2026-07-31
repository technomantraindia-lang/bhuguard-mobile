import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export interface KeyboardAwareScreenProps {
  children: ReactNode;
  /** Extra content below the scroll area (sticky footer / keypad). Not scrolled. */
  footer?: ReactNode;
  edges?: Edge[];
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** When false, only SafeArea + KeyboardAvoidingView (no ScrollView). Use for map screens. */
  scroll?: boolean;
  keyboardVerticalOffset?: number;
  /** Android: prefer height so adjustResize + KAV work together. */
  behavior?: 'padding' | 'height' | undefined;
}

/**
 * App-wide keyboard-safe shell for form screens.
 * Do not wrap interactive MapLibre maps with scroll=true.
 */
export function KeyboardAwareScreen({
  children,
  footer,
  edges = ['top', 'bottom'],
  backgroundColor = 'transparent',
  style,
  contentContainerStyle,
  scroll = true,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 8 : 0,
  behavior = Platform.OS === 'ios' ? 'padding' : 'height',
}: KeyboardAwareScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  footer: {
    flexShrink: 0,
  },
});
