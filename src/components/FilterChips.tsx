import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors } from '../theme/colors';

export interface FilterChipOption {
  key: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (key: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((option) => {
        const active = option.key === value;

        return (
          <Pressable
            key={option.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(option.key)}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  text: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  textActive: { color: colors.primary },
});
