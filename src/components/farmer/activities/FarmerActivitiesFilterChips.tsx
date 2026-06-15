import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { ACTIVITY_FILTER_CHIPS, type ActivityFilterChip } from '../../../utils/farmerActivityHelpers';

interface FarmerActivitiesFilterChipsProps {
  selected: ActivityFilterChip;
  onSelect: (filter: ActivityFilterChip) => void;
}

export function FarmerActivitiesFilterChips({ selected, onSelect }: FarmerActivitiesFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ACTIVITY_FILTER_CHIPS.map((chip) => {
        const active = selected === chip.id;

        return (
          <Pressable
            key={chip.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(chip.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderColor: dashboardTheme.primaryContainer,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.textMuted,
  },
  chipTextActive: {
    color: dashboardTheme.headingGreen,
  },
});
