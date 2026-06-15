import { useState } from 'react';
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

import { colors } from '../theme/colors';

export interface SelectOption {
  id: number;
  name: string;
}

interface FormSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  displayValue?: string;
  options: SelectOption[];
  loading?: boolean;
  error?: string | null;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSelect: (option: SelectOption) => void;
  disabled?: boolean;
}

export function FormSelect({
  label,
  placeholder = 'Select...',
  value,
  displayValue,
  options,
  loading = false,
  error,
  searchable = false,
  searchValue = '',
  onSearchChange,
  onSelect,
  disabled = false,
}: FormSelectProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable ? (
              <TextInput
                style={styles.search}
                value={searchValue}
                onChangeText={onSearchChange}
                placeholder="Search village..."
              />
            ) : null}
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={<Text style={styles.empty}>No options found</Text>}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.option}
                    onPress={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.optionText}>{item.name}</Text>
                  </Pressable>
                )}
              />
            )}
            <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  trigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  triggerText: { fontSize: 16, color: colors.text, flex: 1 },
  placeholder: { color: colors.textMuted },
  error: { color: colors.error, fontSize: 13 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    padding: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  loader: { marginVertical: 24 },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: 16, color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, padding: 24 },
  closeBtn: { marginTop: 12, alignItems: 'center', padding: 12 },
  closeText: { color: colors.primary, fontWeight: '700' },
});
