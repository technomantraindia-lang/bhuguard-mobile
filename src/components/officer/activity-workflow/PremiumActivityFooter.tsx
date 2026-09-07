import { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardOverlapInset } from '../../../hooks/useKeyboardOverlapInset';
import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

interface PremiumActivityFooterProps {
  showPrevious: boolean;
  previousLabel?: string;
  primaryLabel: string;
  onPrevious?: () => void;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export function PremiumActivityFooter({
  showPrevious,
  previousLabel = 'Previous',
  primaryLabel,
  onPrevious,
  onPrimary,
  primaryDisabled = false,
  loading = false,
  loadingLabel = 'Please wait...',
}: PremiumActivityFooterProps) {
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlapInset();
  const ripple = useRef(new Animated.Value(1)).current;

  const handlePrimaryPress = () => {
    Animated.sequence([
      Animated.timing(ripple, { toValue: 0.97, duration: 90, useNativeDriver: true }),
      Animated.spring(ripple, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPrimary();
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: insets.bottom + 12 + (Platform.OS === 'android' ? keyboardOverlap : 0),
        },
      ]}
    >
      <View style={styles.bar}>
        {showPrevious ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={onPrevious}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>{previousLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.secondaryPlaceholder} />
        )}

        <Animated.View style={[styles.primaryWrap, { transform: [{ scale: ripple }] }]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (primaryDisabled || loading) && styles.primaryDisabled,
              pressed && !primaryDisabled && !loading && styles.buttonPressed,
            ]}
            onPress={handlePrimaryPress}
            disabled={primaryDisabled || loading}
          >
            <Text style={styles.primaryText}>{loading ? loadingLabel : primaryLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: premiumWorkflowTheme.glassBackground,
    borderTopWidth: 1,
    borderTopColor: premiumWorkflowTheme.glassBorder,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryPlaceholder: { width: 108 },
  secondaryButton: {
    minWidth: 108,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: premiumWorkflowTheme.glassBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: premiumWorkflowTheme.textSecondary,
  },
  primaryWrap: { flex: 1 },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: premiumWorkflowTheme.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(11, 107, 58, 0.28)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  buttonPressed: { opacity: 0.92 },
});
