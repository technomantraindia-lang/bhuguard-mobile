import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { FarmerActivitiesSummary } from '../../../utils/farmerActivityHelpers';

interface FarmerActivityVerificationCardProps {
  summary: FarmerActivitiesSummary;
  onViewReport: () => void;
}

export function FarmerActivityVerificationCard({ summary, onViewReport }: FarmerActivityVerificationCardProps) {
  return (
    <View style={[styles.card, dashboardShadow]}>
      <View style={styles.header}>
        <BhuguardMaterialIcon name="verified" size={22} color={dashboardTheme.primaryContainer} />
        <Text style={styles.title}>Verification Status</Text>
      </View>

      <View style={styles.rows}>
        <InfoRow label="Last Verification" value={summary.lastVerificationLabel ?? 'Not available yet'} />
        <InfoRow label="Field Officer" value={summary.fieldOfficerName ?? 'Assigned soon'} />
        <InfoRow label="Current Status" value={summary.verificationStatusLabel} highlight />
      </View>

      <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onViewReport}>
        <Text style={styles.buttonText}>View Verification Report</Text>
        <BhuguardMaterialIcon name="arrow_forward" size={18} color={dashboardTheme.primaryContainer} />
      </Pressable>
    </View>
  );
}

function InfoRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  rows: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: dashboardTheme.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flex: 1,
    textAlign: 'right',
  },
  valueHighlight: {
    color: dashboardTheme.primaryContainer,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 10,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
