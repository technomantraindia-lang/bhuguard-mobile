import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';

interface PasswordInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'Enter password',
  editable = true,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        editable={editable}
        autoCapitalize="none"
      />
      <Pressable onPress={() => setVisible((v) => !v)} style={styles.toggle}>
        <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 64,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
