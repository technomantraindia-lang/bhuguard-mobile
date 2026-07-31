import { StyleSheet, Text, TextInput, View } from 'react-native';

interface GlassMobileInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  editable?: boolean;
}

export function GlassMobileInput({
  value,
  onChangeText,
  onBlur,
  invalid = false,
  editable = true,
}: GlassMobileInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Mobile Number</Text>
      <View style={[styles.inputShell, invalid && styles.inputInvalid]}>
        <Text style={styles.prefix}>+91</Text>
        <View style={styles.divider} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="9876543210"
          placeholderTextColor="rgba(255,255,255,0.42)"
          editable={editable}
          accessibilityLabel="Mobile number"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputShell: {
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputInvalid: {
    borderColor: 'rgba(255, 160, 160, 0.85)',
  },
  prefix: {
    fontSize: 17,
    fontWeight: '700',
    color: 'rgba(232, 255, 244, 0.96)',
    marginRight: 12,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 14,
  },
});
