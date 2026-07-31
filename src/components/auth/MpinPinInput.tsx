import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { authBrand } from '../../theme/authBrand';

interface MpinPinInputProps {
  length?: number;
  value: string;
  onPress?: () => void;
  focused?: boolean;
}

export function MpinPinInput({ length = 6, value, onPress, focused = false }: MpinPinInputProps) {
  const { width } = useWindowDimensions();
  const digits = value.split('');
  const boxWidth = width < 360 ? 40 : width < 400 ? 44 : 46;
  const boxHeight = width < 360 ? 46 : width < 400 ? 50 : 52;
  const gap = width < 360 ? 6 : 8;

  const content = (
    <View style={[styles.row, { gap }, focused && styles.rowFocused]}>
      {Array.from({ length }).map((_, index) => {
        const filled = digits[index] !== undefined;

        return (
          <View
            key={index}
            style={[
              styles.box,
              { width: boxWidth, height: boxHeight },
              filled && styles.boxFilled,
              focused && styles.boxFocused,
            ]}
          >
            {filled ? <View style={styles.dot} /> : null}
          </View>
        );
      })}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Enter MPIN"
        accessibilityHint="Opens the number keypad"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  rowFocused: {
    opacity: 1,
  },
  box: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(11, 46, 31, 0.18)',
    backgroundColor: authBrand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: authBrand.accent,
  },
  boxFocused: {
    borderColor: authBrand.primary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: authBrand.tertiary,
  },
});
