import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BhuguardMaterialIcon } from './shared/BhuguardMaterialIcon';
import type { SelectOption } from './FormSelect';
import { colors } from '../theme/colors';

interface FormMultiSelectProps {
  label: string;
  placeholder?: string;
  values: number[];
  options: SelectOption[];
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  searchable?: boolean;
  onChange: (ids: number[]) => void;
}

export function FormMultiSelect({
  label,
  placeholder = 'Select...',
  values,
  options,
  loading = false,
  error,
  disabled = false,
  searchable = true,
  onChange,
}: FormMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedNames = useMemo(() => {
    const selected = new Set(values);
    return options.filter((option) => selected.has(option.id)).map((option) => option.name);
  }, [options, values]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => option.name.toLowerCase().includes(query));
  }, [options, search]);

  const toggle = (id: number) => {
    if (values.includes(id)) {
      onChange(values.filter((value) => value !== id));
      return;
    }

    onChange([...values, id]);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text style={[styles.triggerText, selectedNames.length === 0 && styles.placeholder]} numberOfLines={3}>
          {selectedNames.length > 0 ? selectedNames.join(', ') : placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </Pressable>
      {selectedNames.length > 0 ? (
        <View style={styles.chips}>
          {selectedNames.map((name) => (
            <View key={name} style={styles.chip}>
              <Text style={styles.chipText}>{name}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Select one or more villages for the working area.</Text>
            {searchable ? (
              <TextInput
                style={styles.search}
                value={search}
                onChangeText={setSearch}
                placeholder="Search village..."
                placeholderTextColor={colors.textMuted}
              />
            ) : null}
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={<Text style={styles.empty}>No villages found for this taluka.</Text>}
                renderItem={({ item }) => {
                  const selected = values.includes(item.id);
                  return (
                    <Pressable style={[styles.option, selected && styles.optionSelected]} onPress={() => toggle(item.id)}>
                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.name}</Text>
                      {selected ? <BhuguardMaterialIcon name="check" size={20} color={colors.primary} /> : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700' },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disabled: { opacity: 0.5 },
  triggerText: { color: colors.text, flex: 1, fontSize: 15 },
  placeholder: { color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: colors.softGreen,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 12 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '80%',
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  done: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: 10 },
  search: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loader: { marginVertical: 24 },
  empty: { color: colors.textMuted, paddingVertical: 24, textAlign: 'center' },
  option: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  optionSelected: { backgroundColor: 'rgba(46, 125, 50, 0.06)' },
  optionText: { color: colors.text, flex: 1, fontSize: 15 },
  optionTextSelected: { color: colors.primary, fontWeight: '700' },
});
