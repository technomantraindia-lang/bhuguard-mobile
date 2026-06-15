import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { formatDisplay } from '../utils/apiHelpers';

interface DetailRowProps {
  label: string;
  value?: unknown;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatDisplay(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  value: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
