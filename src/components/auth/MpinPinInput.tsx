import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

interface MpinPinInputProps {
  length?: number;
  value: string;
}

export function MpinPinInput({ length = 6, value }: MpinPinInputProps) {
  const digits = value.split('');

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, index) => {
        const filled = digits[index] !== undefined;

        return (
          <View key={index} style={[styles.box, filled && styles.boxFilled]}>
            {filled ? <View style={styles.dot} /> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 46,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
  },
});
