import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { FARMER_FARM_AREA_UNITS, type FarmerFarmAreaUnit } from '../../../constants/farmerFarmAreaUnits';

interface FarmAreaUnitPickerProps {
  value: FarmerFarmAreaUnit;
  onChange: (value: FarmerFarmAreaUnit) => void;
  error?: string;
}

export function FarmAreaUnitPicker({ value, onChange, error }: FarmAreaUnitPickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Area Unit</Text>

      <View style={styles.row}>
        {FARMER_FARM_AREA_UNITS.map((option) => {
          const active = value === option.value;

          return (
            <Pressable
              key={option.value}
              style={[styles.chip, active && styles.chipActive, error ? styles.chipError : null]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderColor: dashboardTheme.primaryContainer,
  },
  chipError: {
    borderColor: dashboardTheme.error,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  chipTextActive: {
    color: dashboardTheme.headingGreen,
  },
  error: {
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.error,
    fontWeight: '500',
  },
});
