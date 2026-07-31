import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authBrand } from '../../../theme/authBrand';

interface GlassContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

/**
 * Solid brand CTA with explicit white label text (Android-safe).
 */
export function GlassContinueButton({
  onPress,
  disabled = false,
  loading = false,
  label = 'Continue',
}: GlassContinueButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInactive = disabled && !loading;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => {
        if (disabled || loading) {
          return;
        }
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
      }}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      <Animated.View
        style={[
          styles.button,
          isInactive ? styles.buttonDisabled : styles.buttonEnabled,
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.row}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : null}
          <Text
            style={[styles.label, isInactive ? styles.labelDisabled : styles.labelEnabled]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {label}
          </Text>
          {!loading ? (
            <View style={[styles.arrowCircle, isInactive && styles.arrowCircleDisabled]}>
              <Text style={[styles.arrowText, isInactive && styles.arrowTextDisabled]}>→</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  button: {
    minHeight: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#0B2E1F',
    shadowColor: '#03150D',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#E4EBE6',
    borderWidth: 1,
    borderColor: '#D0D9D3',
    elevation: 0,
    shadowOpacity: 0,
  },
  row: {
    minHeight: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    includeFontPadding: false,
    marginHorizontal: 10,
  },
  labelEnabled: {
    color: '#FFFFFF',
  },
  labelDisabled: {
    color: '#6B7C72',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowCircleDisabled: {
    backgroundColor: '#F4F7F5',
  },
  arrowText: {
    color: authBrand.primary,
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 20,
  },
  arrowTextDisabled: {
    color: '#7A8A80',
  },
});
