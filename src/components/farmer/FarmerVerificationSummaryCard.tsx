import { StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { DashboardPressable } from '../shared/DashboardPressable';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerVerificationSummaryCardProps {
  lastVisitLabel: string;
  fieldOfficerName: string;
  statusLabel: string;
  onPress: () => void;
}

export function FarmerVerificationSummaryCard({
  lastVisitLabel,
  fieldOfficerName,
  statusLabel,
  onPress,
}: FarmerVerificationSummaryCardProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Verification Summary</Text>

      <DashboardPressable onPress={onPress} style={[styles.card, dashboardShadow]}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <BhuguardMaterialIcon name="fact_check" size={20} color={dashboardTheme.primaryContainer} />
          </View>
          <Text style={styles.cardTitle}>Field Verification</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.item}>
            <Text style={styles.label}>Last Visit</Text>
            <Text style={styles.value}>{lastVisitLabel}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Field Officer</Text>
            <Text style={styles.value}>{fieldOfficerName}</Text>
          </View>
          <View style={styles.itemFull}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, styles.statusValue]}>{statusLabel}</Text>
          </View>
        </View>
      </DashboardPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  item: {
    width: '47%',
    gap: 4,
  },
  itemFull: {
    width: '100%',
    gap: 4,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: dashboardTheme.onSurface,
  },
  statusValue: {
    color: dashboardTheme.primaryContainer,
    fontWeight: '600',
  },
});
