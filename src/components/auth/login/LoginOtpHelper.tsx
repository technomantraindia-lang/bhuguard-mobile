import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { loginTheme } from './Theme';

interface LoginOtpHelperProps {
  text: string;
}

function LockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 11V8a5 5 0 0110 0v3"
        stroke={loginTheme.darkText}
        strokeWidth={1.8}
        strokeLinecap="round"
        opacity={0.7}
      />
      <Path
        d="M6 11h12v9a1 1 0 01-1 1H7a1 1 0 01-1-1v-9z"
        stroke={loginTheme.darkText}
        strokeWidth={1.8}
        strokeLinejoin="round"
        opacity={0.7}
      />
    </Svg>
  );
}

function LoginOtpHelperComponent({ text }: LoginOtpHelperProps) {
  return (
    <View style={styles.wrap}>
      <LockIcon />
      <Text style={styles.text} allowFontScaling={false}>
        {text}
      </Text>
    </View>
  );
}

export const LoginOtpHelper = memo(LoginOtpHelperComponent);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 4,
    overflow: 'visible',
  },
  text: {
    width: '100%',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: loginTheme.textMuted,
    textAlign: 'center',
    fontFamily: loginTheme.fonts.medium,
  },
});
