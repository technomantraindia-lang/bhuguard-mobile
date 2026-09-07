import { forwardRef, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useKeyboardOverlapInset } from '../../hooks/useKeyboardOverlapInset';

interface KeyboardSafeScrollViewProps extends Omit<ScrollViewProps, 'keyboardShouldPersistTaps'> {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  extraBottomPadding?: number;
}

function resolveLayoutPaddingBottom(style: StyleProp<ViewStyle> | undefined): number {
  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  return typeof flat?.paddingBottom === 'number' ? flat.paddingBottom : 0;
}

/**
 * Drop-in ScrollView for screens that already have their own header/chrome.
 * Adds keyboard overlap padding and iOS inset adjustment without duplicating KAV logic.
 */
export const KeyboardSafeScrollView = forwardRef<ScrollView, KeyboardSafeScrollViewProps>(
  function KeyboardSafeScrollView(
    { children, contentContainerStyle, extraBottomPadding = 32, style, ...rest },
    ref,
  ) {
    const overlap = useKeyboardOverlapInset();
    const layoutPad = resolveLayoutPaddingBottom(contentContainerStyle);
    const bottomPad = layoutPad + extraBottomPadding + (Platform.OS === 'ios' ? 0 : overlap);

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          {...rest}
          ref={ref}
          style={[styles.flex, style]}
          contentContainerStyle={[contentContainerStyle, { flexGrow: 1, paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  },
);

interface KeyboardAvoidingHostProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
}

/** For search + FlatList screens (no ScrollView). Lifts content by remaining keyboard overlap. */
export function KeyboardAvoidingHost({
  children,
  style,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 8 : 0,
}: KeyboardAvoidingHostProps) {
  const overlap = useKeyboardOverlapInset();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={[styles.flex, Platform.OS === 'android' && overlap > 0 ? { paddingBottom: overlap } : null]}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
