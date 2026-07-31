import { memo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { pressIn, pressOut } from './Animations';
import { loginTheme } from './Theme';

interface PrimaryButtonProps {
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5v6.1c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h12M13 6l6 6-6 6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PrimaryButtonComponent({
  onPress,
  label = 'Send OTP',
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const isInactive = disabled && !loading;
  const iconColor = isInactive ? '#5F7468' : '#FFFFFF';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => {
        if (disabled || loading) {
          return;
        }
        pressIn(pressScale);
      }}
      onPressOut={() => pressOut(pressScale)}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      <Animated.View
        style={[
          styles.shadow,
          isInactive ? styles.shadowDisabled : styles.shadowEnabled,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        <View style={[styles.button, isInactive ? styles.buttonDisabled : styles.buttonEnabled]}>
          <View style={styles.row}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ShieldIcon color={iconColor} />
            )}
            <Text
              style={[styles.label, isInactive ? styles.labelDisabled : styles.labelEnabled]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {label}
            </Text>
            {!loading ? <ArrowIcon color={iconColor} /> : <View style={styles.arrowSpacer} />}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export const PrimaryButton = memo(PrimaryButtonComponent);

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  shadow: {
    borderRadius: 18,
  },
  shadowEnabled: {
    shadowColor: loginTheme.ctaGreen,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  shadowDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  button: {
    minHeight: 56,
    borderRadius: 18,
    justifyContent: 'center',
  },
  buttonEnabled: {
    backgroundColor: loginTheme.ctaGreen,
  },
  buttonDisabled: {
    backgroundColor: '#E8F0E4',
    borderWidth: 1,
    borderColor: 'rgba(15, 122, 69, 0.18)',
  },
  row: {
    minHeight: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    gap: 10,
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    includeFontPadding: false,
    fontFamily: loginTheme.fonts.bold,
  },
  labelEnabled: {
    color: '#FFFFFF',
  },
  labelDisabled: {
    color: '#3F5A4C',
  },
  arrowSpacer: {
    width: 18,
  },
});
