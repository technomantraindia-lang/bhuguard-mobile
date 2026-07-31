import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { loginTheme } from './Theme';

interface LoginTrustFooterProps {
  text: string;
}

function ShieldIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 5v6.1c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3z"
        stroke={loginTheme.primaryGreen}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={loginTheme.primaryGreen}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LoginTrustFooterComponent({ text }: LoginTrustFooterProps) {
  return (
    <View style={styles.wrap}>
      <ShieldIcon />
      <Text style={styles.text} allowFontScaling={false}>
        {text}
      </Text>
    </View>
  );
}

export const LoginTrustFooter = memo(LoginTrustFooterComponent);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxWidth: '100%',
  },
  text: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: loginTheme.primaryGreen,
    letterSpacing: 0.2,
    textAlign: 'center',
    fontFamily: loginTheme.fonts.semiBold,
  },
});
