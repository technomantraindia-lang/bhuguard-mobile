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

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

export interface FarmSelectOption {
  id: number;
  name: string;
  pincode?: string | null;
}

interface FarmFormSelectProps {
  label: string;
  placeholder?: string;
  value: string;
  displayValue?: string;
  options: FarmSelectOption[];
  loading?: boolean;
  error?: string;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  onSelect: (option: FarmSelectOption) => void;
  onCustomValue?: (text: string) => void;
  customValueLabel?: string;
  disabled?: boolean;
}

export function FarmFormSelect({
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
  onCustomValue,
  customValueLabel = 'Use this name',
  disabled = false,
}: FarmFormSelectProps) {
  const [open, setOpen] = useState(false);
  const trimmedSearch = searchValue.trim();
  const showCustomOption =
    searchable && trimmedSearch.length > 0 && onCustomValue && !options.some((item) => item.name.toLowerCase() === trimmedSearch.toLowerCase());

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.trigger, disabled && styles.disabled, error ? styles.triggerError : null]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text style={[styles.triggerText, !value && !displayValue && styles.placeholder]} numberOfLines={1}>
          {displayValue || placeholder}
        </Text>
        {loading ? <ActivityIndicator size="small" color={dashboardTheme.primary} /> : null}
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
                placeholder="Search..."
                placeholderTextColor={dashboardTheme.textMuted}
                autoCorrect={false}
              />
            ) : null}

            {showCustomOption ? (
              <Pressable
                style={styles.customOption}
                onPress={() => {
                  onCustomValue?.(trimmedSearch);
                  setOpen(false);
                }}
              >
                <Text style={styles.customOptionText}>
                  {customValueLabel}: <Text style={styles.customOptionValue}>{trimmedSearch}</Text>
                </Text>
              </Pressable>
            ) : null}

            {loading ? (
              <ActivityIndicator color={dashboardTheme.primary} style={styles.loader} />
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={20}
                maxToRenderPerBatch={30}
                windowSize={10}
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    {trimmedSearch
                      ? 'No matches found. Tap "Use village name" above or type manually below.'
                      : 'No villages found for this taluka. Use manual entry below.'}
                  </Text>
                }
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
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  trigger: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: dashboardTheme.surfaceLowest,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  triggerError: {
    borderColor: dashboardTheme.error,
  },
  disabled: {
    opacity: 0.6,
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  triggerText: {
    fontSize: 15,
    color: dashboardTheme.onSurface,
    flex: 1,
    paddingRight: 8,
  },
  placeholder: {
    color: dashboardTheme.textMuted,
  },
  error: {
    color: dashboardTheme.error,
    fontSize: 12,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    padding: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: dashboardTheme.headingGreen,
  },
  search: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: dashboardTheme.onSurface,
    backgroundColor: dashboardTheme.background,
  },
  customOption: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.primaryContainer,
  },
  customOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  customOptionValue: {
    fontWeight: '700',
  },
  loader: {
    marginVertical: 24,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  optionText: {
    fontSize: 15,
    color: dashboardTheme.onSurface,
  },
  empty: {
    textAlign: 'center',
    color: dashboardTheme.textMuted,
    padding: 24,
    lineHeight: 20,
  },
  closeBtn: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
  },
  closeText: {
    color: dashboardTheme.primaryContainer,
    fontWeight: '700',
    fontSize: 15,
  },
});
