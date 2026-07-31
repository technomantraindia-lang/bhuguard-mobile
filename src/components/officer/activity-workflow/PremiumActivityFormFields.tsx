import { StyleSheet, Text, TextInput, View } from 'react-native';

import { premiumWorkflowTheme } from './premiumActivityWorkflowTheme';

interface PremiumFieldProps {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function PremiumTextField({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
}: PremiumFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputReadonly]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={premiumWorkflowTheme.textMuted}
      />
    </View>
  );
}

export function PremiumReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readonlyBox}>
        <Text style={styles.readonlyText}>{value}</Text>
      </View>
    </View>
  );
}

export function PremiumInfoPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={styles.infoPanel}>
      <Text style={styles.infoTitle}>{title}</Text>
      {lines.map((line) => (
        <Text key={line} style={styles.infoLine}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: premiumWorkflowTheme.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: premiumWorkflowTheme.textPrimary,
    backgroundColor: '#FAFCFB',
  },
  inputReadonly: {
    backgroundColor: '#F3F6F4',
    color: premiumWorkflowTheme.textMuted,
  },
  readonlyBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F3F6F4',
    borderWidth: 1,
    borderColor: premiumWorkflowTheme.glassBorder,
  },
  readonlyText: {
    fontSize: 16,
    fontWeight: '600',
    color: premiumWorkflowTheme.textPrimary,
  },
  infoPanel: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: premiumWorkflowTheme.primaryGreenSoft,
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: premiumWorkflowTheme.primaryGreen,
  },
  infoLine: {
    fontSize: 14,
    lineHeight: 20,
    color: premiumWorkflowTheme.textSecondary,
    fontWeight: '500',
  },
});
