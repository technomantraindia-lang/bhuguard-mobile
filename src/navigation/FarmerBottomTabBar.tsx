import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { dashboardShadowUp } from '../theme/bhuguardDashboardTheme';
import { RoleBottomTabBar, type RoleTabConfig } from './shared/RoleBottomTabBar';

const FARMER_TABS: RoleTabConfig[] = [
  { routeName: 'Home', labelKey: 'tabs.farmer.home', icon: 'home', filledWhenActive: true },
  { routeName: 'Farms', labelKey: 'tabs.farmer.farms', icon: 'potted_plant' },
  { routeName: 'Activities', labelKey: 'tabs.farmer.activity', icon: 'assignment' },
  { routeName: 'Profile', labelKey: 'tabs.farmer.profile', icon: 'person', filledWhenActive: true },
];

export function FarmerBottomTabBar(props: BottomTabBarProps) {
  return <RoleBottomTabBar {...props} tabs={FARMER_TABS} shadowStyle={dashboardShadowUp} />;
}
