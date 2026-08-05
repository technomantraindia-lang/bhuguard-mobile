import { memo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PhoneInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  fontsLoaded?: boolean;
}

function PhoneIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
        fill="#0B4A2B"
      />
    </Svg>
  );
}

function PhoneInputComponent({
  value,
  onChangeText,
  placeholder = 'Enter mobile number',
  invalid = false,
  fontsLoaded = false,
  editable = true,
  onBlur,
  onFocus,
  ...rest
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.shell,
        focused && styles.shellFocused,
        invalid ? styles.shellInvalid : null,
      ]}
      accessibilityLabel="Mobile number input"
    >
      <View style={styles.iconWrap}>
        <PhoneIcon />
      </View>
      <Text style={[styles.prefix, fontsLoaded ? styles.prefixFont : null]}>+91</Text>
      <TextInput
        {...rest}
        style={[styles.input, fontsLoaded ? styles.inputFont : null]}
        value={value}
        onChangeText={onChangeText}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        keyboardType="phone-pad"
        maxLength={10}
        placeholder={placeholder}
        placeholderTextColor="#9A9A9A"
        editable={editable}
        selectionColor="#0B4A2B"
        textContentType="telephoneNumber"
        autoComplete="tel"
        accessibilityLabel="Mobile number"
      />
    </View>
  );
}

export const PhoneInput = memo(PhoneInputComponent);

const styles = StyleSheet.create({
  shell: {
    minHeight: 54,
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  shellFocused: {
    backgroundColor: '#FFFFFF',
  },
  shellInvalid: {
    borderWidth: 1,
    borderColor: 'rgba(181, 59, 59, 0.85)',
  },
  iconWrap: {
    flexShrink: 0,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.2,
  },
  prefixFont: {
    fontFamily: 'Outfit_700Bold',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    paddingVertical: 14,
    includeFontPadding: false,
  },
  inputFont: {
    fontFamily: 'Outfit_500Medium',
  },
});
