import { Pressable, StyleSheet, Text } from 'react-native';

import { useFabBottomOffset } from '../../../hooks/useTabBarLayout';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmerActivitiesFabProps {
  onPress: () => void;
}

export function FarmerActivitiesFab({ onPress }: FarmerActivitiesFabProps) {
  const bottom = useFabBottomOffset();

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, dashboardShadow, { bottom }, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add Biochar"
    >
      <BhuguardMaterialIcon name="add_circle" size={22} color={dashboardTheme.onPrimary} />
      <Text style={styles.label}>Add Biochar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: dashboardTheme.marginMobile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
});
