import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

export function VerificationSectionCard({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function VerificationInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export function VerificationTextField({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={officerTheme.outline}
        style={[styles.input, props.multiline && styles.inputMultiline, props.style]}
      />
    </View>
  );
}

export function VerificationPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && styles.primaryButtonDisabled,
        pressed && !disabled && styles.primaryButtonPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={styles.primaryButtonText}>{loading ? 'Saving...' : label}</Text>
    </Pressable>
  );
}

export function VerificationSecondaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]} onPress={onPress}>
      {icon ? <BhuguardMaterialIcon name={icon as never} size={18} color={officerTheme.primary} /> : null}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function VerificationStatusPill({ label }: { label: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusPillText}>{label}</Text>
    </View>
  );
}

export function VerificationChecklistRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.checklistRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <BhuguardMaterialIcon name="verified" size={16} color={officerTheme.onPrimary} /> : null}
      </View>
      <Text style={styles.checklistLabel}>{label}</Text>
    </Pressable>
  );
}

export function VerificationSwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: officerTheme.outlineVariant, true: officerTheme.secondaryContainer }}
        thumbColor={value ? officerTheme.primary : officerTheme.surfaceLowest}
      />
    </View>
  );
}

export function VerificationPhotoSlot({
  label,
  uri,
  onCapture,
}: {
  label: string;
  uri?: string | null;
  onCapture: () => void;
}) {
  return (
    <Pressable style={styles.photoSlot} onPress={onCapture}>
      <BhuguardMaterialIcon name="photo_camera" size={24} color={officerTheme.primary} />
      <Text style={styles.photoSlotLabel}>{label}</Text>
      <Text style={styles.photoSlotHint}>{uri ? 'Photo attached' : 'Tap to capture or upload'}</Text>
    </Pressable>
  );
}

export function VerificationProgressBar({ percent }: { percent: number }) {
  const safePercent = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${safePercent}%` }]} />
      </View>
      <Text style={styles.progressText}>{safePercent}% complete</Text>
    </View>
  );
}

export const inventoryVerificationStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  scrollContent: { padding: officerTheme.marginMobile, paddingBottom: 120, gap: 16 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: officerTheme.primary },
  screenSubtitle: { fontSize: 14, color: officerTheme.onSurfaceVariant, marginTop: 4 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  cardSubtitle: { fontSize: 13, color: officerTheme.onSurfaceVariant, marginTop: -4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { flex: 1, fontSize: 13, color: officerTheme.onSurfaceVariant },
  infoValue: { flex: 1.2, fontSize: 14, fontWeight: '600', color: officerTheme.onSurface, textAlign: 'right' },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: officerTheme.onSurface,
  },
  inputMultiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: officerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonPressed: { transform: [{ scale: 0.98 }] },
  primaryButtonText: { color: officerTheme.onPrimary, fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryButtonPressed: { opacity: 0.9 },
  secondaryButtonText: { color: officerTheme.primary, fontWeight: '700', fontSize: 14 },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: officerTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSecondaryContainer },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: officerTheme.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: officerTheme.primary, borderColor: officerTheme.primary },
  checklistLabel: { flex: 1, fontSize: 14, color: officerTheme.onSurface },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchLabel: { flex: 1, fontSize: 14, color: officerTheme.onSurface },
  photoSlot: {
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: officerTheme.outline,
    backgroundColor: officerTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
  },
  photoSlotLabel: { fontSize: 14, fontWeight: '700', color: officerTheme.primary },
  photoSlotHint: { fontSize: 12, color: officerTheme.onSurfaceVariant },
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: officerTheme.surfaceContainer,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: officerTheme.primaryContainer, borderRadius: 999 },
  progressText: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant },
});
