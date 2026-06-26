import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileOptionSheetProps {
  visible: boolean;
  title: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function ProfileOptionSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: ProfileOptionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.option, selectedValue === option.value && styles.optionSelected]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </Pressable>
          ))}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 8,
    paddingBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    marginBottom: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  optionSelected: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderColor: dashboardTheme.primary,
  },
  optionText: {
    fontSize: 16,
    color: dashboardTheme.onSurface,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
});
