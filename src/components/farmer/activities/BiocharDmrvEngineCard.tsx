import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  calculateBiocharDmrv,
  type BiocharDmrvInputs,
} from '../../../utils/biocharDmrvEngine';

interface BiocharDmrvEngineCardProps {
  value: BiocharDmrvInputs;
  onChange: (patch: Partial<BiocharDmrvInputs>) => void;
}

export function BiocharDmrvEngineCard({ value, onChange }: BiocharDmrvEngineCardProps) {
  const result = useMemo(() => calculateBiocharDmrv(value), [value]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <BhuguardMaterialIcon name="co2" size={20} color={dashboardTheme.primaryContainer} />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>DMRV Engine — Biochar Carbon Removal</Text>
          <Text style={styles.subtitle}>App automatically calculates estimated carbon credits.</Text>
        </View>
      </View>

      <DmrvField
        label="Feedstock Quantity (kg)"
        value={value.feedstockQuantity}
        onChangeText={(text) => onChange({ feedstockQuantity: text.replace(/[^\d.]/g, '') })}
        placeholder="e.g. 500"
      />
      <DmrvField
        label="Biochar Yield (%)"
        value={value.biocharYield}
        onChangeText={(text) => onChange({ biocharYield: text.replace(/[^\d.]/g, '') })}
        placeholder="e.g. 25"
      />
      <DmrvField
        label="Fixed Carbon (%)"
        value={value.fixedCarbonPercent}
        onChangeText={(text) => onChange({ fixedCarbonPercent: text.replace(/[^\d.]/g, '') })}
        placeholder="e.g. 72"
      />

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>Estimated Carbon Credits</Text>
        {result ? (
          <>
            <Text style={styles.resultValue}>{result.estimatedCarbonCredits.toFixed(4)} tCO₂e</Text>
            <Text style={styles.resultMeta}>
              Biochar produced: {result.biocharProducedKg.toFixed(2)} kg • Carbon stored:{' '}
              {result.carbonStoredKg.toFixed(2)} kg
            </Text>
          </>
        ) : (
          <Text style={styles.resultPlaceholder}>Enter all three values to calculate credits.</Text>
        )}
      </View>
    </View>
  );
}

function DmrvField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dashboardTheme.outline}
        keyboardType="decimal-pad"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.onSurfaceVariant,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  input: {
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: dashboardTheme.onSurface,
    backgroundColor: dashboardTheme.background,
  },
  resultCard: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.onSurfaceVariant,
  },
  resultValue: {
    fontSize: 22,
    fontWeight: '800',
    color: dashboardTheme.primaryContainer,
  },
  resultMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.onSurfaceVariant,
  },
  resultPlaceholder: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
  },
});
