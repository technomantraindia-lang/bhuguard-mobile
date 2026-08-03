import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfileFormFieldProps {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  /** Phase 12.7 — start read-only; pencil unlocks only this field. */
  pencilEdit?: boolean;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  /** Notifies parent when pencil edit session starts/stops (for leave-dirty guard). */
  onEditingChange?: (editing: boolean) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function ProfileFormField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  pencilEdit = false,
  onSaveEdit,
  onCancelEdit,
  onEditingChange,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: ProfileFormFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const snapshotRef = useRef(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
      snapshotRef.current = value;
    }
  }, [editing, value]);

  const canPencil = pencilEdit && editable && Boolean(onChangeText);
  const inputEditable = canPencil ? editing : editable;

  const startEdit = () => {
    snapshotRef.current = value;
    setDraft(value);
    setEditing(true);
    onEditingChange?.(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelEdit = () => {
    setDraft(snapshotRef.current);
    onChangeText?.(snapshotRef.current);
    setEditing(false);
    onEditingChange?.(false);
    onCancelEdit?.();
  };

  const saveEdit = () => {
    onChangeText?.(draft);
    setEditing(false);
    onEditingChange?.(false);
    onSaveEdit?.();
  };

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {canPencil && !editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label}`}
            hitSlop={8}
            onPress={startEdit}
            style={styles.pencilButton}
          >
            <Text style={styles.pencilGlyph}>✎</Text>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        ref={inputRef}
        value={canPencil ? draft : value}
        onChangeText={(next) => {
          if (canPencil) {
            setDraft(next);
            onChangeText?.(next);
          } else {
            onChangeText?.(next);
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={dashboardTheme.textMuted}
        editable={inputEditable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoFocus={false}
        style={[styles.input, !inputEditable && styles.inputDisabled]}
      />
      {canPencil && editing ? (
        <View style={styles.editActions}>
          <Pressable onPress={cancelEdit} style={styles.actionChip}>
            <Text style={styles.actionChipText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={saveEdit} style={[styles.actionChip, styles.actionChipPrimary]}>
            <Text style={[styles.actionChipText, styles.actionChipTextPrimary]}>Save</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  pencilButton: {
    padding: 4,
  },
  pencilGlyph: {
    fontSize: 16,
    color: dashboardTheme.primaryContainer,
    fontWeight: '700',
  },
  input: {
    backgroundColor: dashboardTheme.background,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurface,
  },
  inputDisabled: {
    backgroundColor: dashboardTheme.surfaceContainerLow,
    color: dashboardTheme.textMuted,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  actionChipPrimary: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderColor: dashboardTheme.primaryContainer,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  actionChipTextPrimary: {
    color: '#fff',
  },
});
