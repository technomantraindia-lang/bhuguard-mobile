import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { BhuguardMaterialIcon, type BhuguardIconName } from '../shared/BhuguardMaterialIcon';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerShadow, officerTheme } from '../../theme/officerDashboardTheme';

const TABS: Array<{ label: string; icon: BhuguardIconName; tab: 'Home' | 'Farmers' | 'MyArtisans' | 'Profile' }> = [
  { label: 'Dashboard', icon: 'assignment_turned_in', tab: 'Home' },
  { label: 'Farmers', icon: 'group', tab: 'Farmers' },
  { label: 'My Artisan Pros', icon: 'badge', tab: 'MyArtisans' },
  { label: 'Profile', icon: 'account_circle', tab: 'Profile' },
];

interface OfficerScreenBottomNavProps {
  activeTab?: 'Home' | 'Farmers' | 'MyArtisans' | 'Profile';
}

export function OfficerScreenBottomNav({ activeTab = 'Home' }: OfficerScreenBottomNavProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<FieldOfficerStackParamList>>();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const active = tab.tab === activeTab;

        return (
          <Pressable
            key={tab.label}
            style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.itemPressed]}
            onPress={() => {
              navigation.navigate('FieldOfficerTabs', { screen: tab.tab });
            }}
          >
            {active ? (
              <View style={styles.activeIconWrap}>
                <BhuguardMaterialIcon
                  name={tab.icon}
                  size={20}
                  color={officerTheme.onPrimaryContainer}
                  filled={tab.icon === 'assignment_turned_in' || tab.icon === 'event_note'}
                />
              </View>
            ) : (
              <BhuguardMaterialIcon name={tab.icon} size={22} color={officerTheme.onSurfaceVariant} filled={false} />
            )}
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
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
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 72,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: officerTheme.outlineVariant,
    ...officerShadow,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 56,
    gap: 4,
    flex: 1,
  },
  itemActive: {
    backgroundColor: officerTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  itemPressed: {
    transform: [{ scale: 0.96 }],
  },
  activeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: officerTheme.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  labelActive: {
    color: officerTheme.primaryContainer,
    fontWeight: '700',
  },
});
