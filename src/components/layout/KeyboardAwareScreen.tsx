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

import { useKeyboardOverlapInset } from '../../hooks/useKeyboardOverlapInset';

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
  /** Android: omit KAV behavior when the window already resizes; iOS uses padding. */
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
  behavior = Platform.OS === 'ios' ? 'padding' : undefined,
}: KeyboardAwareScreenProps) {
  const overlap = useKeyboardOverlapInset();
  const bottomPad = 32 + (Platform.OS === 'ios' ? 0 : overlap);

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
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
        {footer ? (
          <View style={[styles.footer, Platform.OS === 'android' ? { marginBottom: overlap } : null]}>
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Preferred name for form/login screens. Same implementation as KeyboardAwareScreen. */
export const KeyboardSafeScreen = KeyboardAwareScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  footer: {
    flexShrink: 0,
  },
});
