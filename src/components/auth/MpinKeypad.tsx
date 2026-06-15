import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../theme/colors';

interface MpinKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onBiometric?: () => void;
  disabled?: boolean;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

function FingerprintIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C9.5 3 8 5 8 7.5V8.5C8 9.9 7.1 11 6 11"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M16 11C14.9 11 14 9.9 14 8.5V7.5C14 5 12.5 3 10 3"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path d="M6 14C6 17.3 8.7 20 12 20C15.3 20 18 17.3 18 14V12" stroke={colors.primary} strokeWidth={1.6} />
      <Path d="M12 20V22" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 12C9 14.2 10.3 16 12 16" stroke={colors.primary} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function BackspaceIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 7H19C20.1 7 21 7.9 21 9V15C21 16.1 20.1 17 19 17H8L4 13L8 9V7Z"
        stroke={colors.primary}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M14 11L16 13M16 11L14 13" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function MpinKeypad({ onDigit, onBackspace, onBiometric, disabled = false }: MpinKeypadProps) {
  return (
    <View style={styles.wrap}>
      {ROWS.map((row) => (
        <View key={row.join('-')} style={styles.row}>
          {row.map((digit) => (
            <Pressable
              key={digit}
              style={[styles.key, disabled && styles.keyDisabled]}
              onPress={() => onDigit(digit)}
              disabled={disabled}
            >
              <Text style={styles.keyText}>{digit}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <View style={styles.row}>
        <Pressable
          style={[styles.key, styles.keySecondary, disabled && styles.keyDisabled]}
          onPress={onBiometric}
          disabled={disabled}
        >
          <FingerprintIcon />
        </Pressable>
        <Pressable
          style={[styles.key, disabled && styles.keyDisabled]}
          onPress={() => onDigit('0')}
          disabled={disabled}
        >
          <Text style={styles.keyText}>0</Text>
        </Pressable>
        <Pressable
          style={[styles.keyGhost, disabled && styles.keyDisabled]}
          onPress={onBackspace}
          disabled={disabled}
        >
          <BackspaceIcon />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  key: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySecondary: {
    backgroundColor: '#EAF7EF',
    borderColor: '#CFE8D8',
  },
  keyGhost: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    opacity: 0.55,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
});
