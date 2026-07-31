import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { authBrand } from '../../theme/authBrand';

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

export function MpinKeypad({
  onDigit,
  onBackspace,
  onBiometric,
  showBiometric = false,
  disabled = false,
  compact = false,
}: MpinKeypadProps) {
  const { width, height } = useWindowDimensions();
  const shortPhone = height < 700 || compact;
  const narrow = width < 360;

  const keyWidth = shortPhone || narrow ? 58 : width < 400 ? 64 : 70;
  const keyHeight = shortPhone || narrow ? 44 : width < 400 ? 50 : 54;
  const keyRadius = keyHeight / 2;
  const rowGap = shortPhone ? 8 : 12;
  const wrapGap = shortPhone ? 8 : 10;
  const keyTextSize = shortPhone ? 22 : 26;
  const iconSize = shortPhone ? 20 : 24;

  const keyStyle = (extra?: object) => [
    styles.key,
    { width: keyWidth, height: keyHeight, borderRadius: keyRadius },
    extra,
    disabled && styles.keyDisabled,
  ];

  return (
    <View style={[styles.wrap, { gap: wrapGap }, shortPhone && styles.wrapCompact]}>
      {ROWS.map((row) => (
        <View key={row.join('-')} style={[styles.row, { gap: rowGap }]}>
          {row.map((digit) => (
            <Pressable
              key={digit}
              style={({ pressed }) => [...keyStyle(), pressed && styles.keyPressed]}
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
            style={({ pressed }) => [
              ...keyStyle(styles.keyBiometric),
              pressed && styles.keyPressed,
            ]}
            onPress={onBiometric}
            disabled={disabled}
            accessibilityLabel="Biometric login"
          >
            <Text style={[styles.iconText, { fontSize: iconSize }]}>◉</Text>
          </Pressable>
        ) : (
          <View style={{ width: keyWidth, height: keyHeight }} />
        )}

        <Pressable
          style={({ pressed }) => [...keyStyle(), pressed && styles.keyPressed]}
          onPress={() => onDigit('0')}
          disabled={disabled}
        >
          <Text style={[styles.keyText, { fontSize: keyTextSize }]}>0</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            ...keyStyle(styles.keyBackspace),
            pressed && styles.keyPressed,
          ]}
          onPress={onBackspace}
          disabled={disabled}
          accessibilityLabel="Backspace"
        >
          <Text style={[styles.iconText, { fontSize: iconSize }]}>⌫</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  wrapCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  key: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: {
    opacity: 0.72,
  },
  keyBiometric: {
    backgroundColor: 'rgba(234, 247, 239, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  keyBackspace: {
    backgroundColor: 'rgba(248, 250, 249, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  keyDisabled: {
    opacity: 0.55,
  },
  keyText: {
    fontWeight: '700',
    color: authBrand.tertiary,
  },
  iconText: {
    fontWeight: '700',
    color: authBrand.primary,
  },
});
