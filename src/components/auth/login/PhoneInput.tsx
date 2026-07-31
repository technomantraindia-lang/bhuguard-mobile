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
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
  placeholder = 'Enter your mobile number',
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
        placeholderTextColor="rgba(80, 80, 80, 0.55)"
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
    minHeight: 62,
    width: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(185, 232, 90, 0.75)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  shellFocused: {
    borderColor: '#B9E85A',
  },
  shellInvalid: {
    borderColor: 'rgba(255, 157, 143, 0.95)',
  },
  iconWrap: {
    flexShrink: 0,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  prefixFont: {
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    paddingVertical: 16,
    includeFontPadding: false,
  },
  inputFont: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
