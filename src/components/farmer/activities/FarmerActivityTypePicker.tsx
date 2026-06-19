import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { FARMER_ACTIVITY_TYPES } from '../../../constants/farmerActivityTypes';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmerActivityTypePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function FarmerActivityTypePicker({ value, onChange }: FarmerActivityTypePickerProps) {
  return (
    <View style={styles.wrap}>
      {FARMER_ACTIVITY_TYPES.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            style={[styles.card, selected && styles.cardSelected]}
            onPress={() => onChange(option.value)}
          >
            <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
              <BhuguardMaterialIcon
                name={option.icon}
                size={24}
                color={selected ? dashboardTheme.primary : dashboardTheme.primaryContainer}
              />
            </View>
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surface,
  },
  cardSelected: {
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  iconWrapSelected: {
    backgroundColor: dashboardTheme.surfaceLow,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: dashboardTheme.onSurfaceVariant,
  },
  labelSelected: {
    color: dashboardTheme.primary,
  },
});
