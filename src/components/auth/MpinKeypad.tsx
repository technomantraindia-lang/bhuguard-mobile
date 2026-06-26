import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/colors';

interface MpinKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
  disabled?: boolean;
  compact?: boolean;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

function FingerprintIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 10.5V14.5M9.5 9.5C9.5 7.5 10.6 6 12 6C13.4 6 14.5 7.2 14.5 9V11.5"
        stroke={colors.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M7 12.5C7 16.1 9.4 18.5 12 18.5C14.6 18.5 17 16.1 17 12.5V11"
        stroke={colors.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M5 14C5.5 17.5 8.2 20 12 20C15.8 20 18.5 17.5 19 14"
        stroke={colors.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M12 20V22" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function BackspaceIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 6H18C19.1 6 20 6.9 20 8V16C20 17.1 19.1 18 18 18H7L3 12L7 6Z"
        stroke={colors.text}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M13 10L15 12M15 10L13 12" stroke={colors.text} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function MpinKeypad({
  onDigit,
  onBackspace,
  onBiometric,
  showBiometric = false,
  disabled = false,
  compact = false,
}: MpinKeypadProps) {
  const keySize = compact ? 64 : 74;
  const keyRadius = compact ? 32 : 37;
  const rowGap = compact ? 10 : 18;
  const wrapGap = compact ? 10 : 14;
  const keyTextSize = compact ? 24 : 28;
  const iconSize = compact ? 24 : 26;

  const keyStyle = (extra?: object) => [
    styles.key,
    { width: keySize, height: keySize, borderRadius: keyRadius },
    extra,
    disabled && styles.keyDisabled,
  ];

  return (
    <View style={[styles.wrap, { gap: wrapGap, paddingHorizontal: compact ? 4 : 8 }]}>
      {ROWS.map((row) => (
        <View key={row.join('-')} style={[styles.row, { gap: rowGap }]}>
          {row.map((digit) => (
            <Pressable
              key={digit}
              style={keyStyle()}
              onPress={() => onDigit(digit)}
              disabled={disabled}
            >
              <Text style={[styles.keyText, { fontSize: keyTextSize }]}>{digit}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <View style={[styles.row, { gap: rowGap }]}>
        {showBiometric && onBiometric ? (
          <Pressable
            style={keyStyle(styles.keyBiometric)}
            onPress={onBiometric}
            disabled={disabled}
            accessibilityLabel="Biometric login"
          >
            <FingerprintIcon size={iconSize} />
          </Pressable>
        ) : (
          <View style={{ width: keySize, height: keySize }} />
        )}

        <Pressable style={keyStyle()} onPress={() => onDigit('0')} disabled={disabled}>
          <Text style={[styles.keyText, { fontSize: keyTextSize }]}>0</Text>
        </Pressable>

        <Pressable
          style={keyStyle(styles.keyBackspace)}
          onPress={onBackspace}
          disabled={disabled}
          accessibilityLabel="Backspace"
        >
          <BackspaceIcon size={iconSize} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  key: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBiometric: {
    backgroundColor: '#EAF7EF',
    borderColor: '#CFE8D8',
  },
  keyBackspace: {
    backgroundColor: '#F8FAF9',
    borderColor: '#D1D5DB',
  },
  keyDisabled: {
    opacity: 0.55,
  },
  keyText: {
    fontWeight: '700',
    color: colors.text,
  },
});
