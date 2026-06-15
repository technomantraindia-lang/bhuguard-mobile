import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../../../shared/BhuguardMaterialIcon';
import type { FarmerStackParamList } from '../../../../navigation/types';
import { dashboardShadowUp, dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';

const TABS: Array<{ label: string; icon: BhuguardIconName; tab: 'Home' | 'Farms' | 'Activities' | 'Reports' | 'Profile' }> = [
  { label: 'Home', icon: 'home', tab: 'Home' },
  { label: 'Farms', icon: 'potted_plant', tab: 'Farms' },
  { label: 'Activity', icon: 'assignment', tab: 'Activities' },
  { label: 'Reports', icon: 'analytics', tab: 'Reports' },
  { label: 'Profile', icon: 'person', tab: 'Profile' },
];

export function FarmDetailBottomNav() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const active = tab.tab === 'Farms';

        return (
          <Pressable
            key={tab.label}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
            onPress={() => {
              navigation.navigate('FarmerTabs', { screen: tab.tab });
            }}
          >
            <BhuguardMaterialIcon
              name={tab.icon}
              size={24}
              color={active ? dashboardTheme.onSecondaryContainer : dashboardTheme.onSurfaceVariant}
              filled={active && tab.icon === 'home'}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: dashboardTheme.tabBarHeight,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    ...dashboardShadowUp,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 56,
    gap: 4,
  },
  itemActive: {
    backgroundColor: dashboardTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  itemPressed: {
    transform: [{ scale: 0.9 }],
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
  },
  labelActive: {
    color: dashboardTheme.onSecondaryContainer,
  },
});
